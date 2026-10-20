import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  DecisionRecord,
  DeterministicCheckResult,
  EvidenceCheckResult,
  ArbitrationStrategyType,
} from '../../common/types';
import { EvaluateCandidatesDto } from './dto/arbitration.dto';
import { DeterministicEvaluator } from './evaluators/deterministic.evaluator';
import { EvidenceEvaluator } from './evaluators/evidence.evaluator';
import { DeterministicRulesStrategy } from './strategies/deterministic.strategy';
import { WeightedScoringStrategy } from './strategies/weighted.strategy';
import { JudgeModelStrategy } from './strategies/judge.strategy';
import { HybridSafeStrategy } from './strategies/hybrid.strategy';
import { PoliciesService } from '../policies/policies.service';
import { AuditService } from '../audit/audit.service';
import { ReviewQueueService } from '../review-queue/review-queue.service';

@Injectable()
export class ArbitrationService {
  private readonly logger = new Logger(ArbitrationService.name);

  constructor(
    private readonly deterministicEvaluator: DeterministicEvaluator,
    private readonly evidenceEvaluator: EvidenceEvaluator,
    private readonly deterministicStrategy: DeterministicRulesStrategy,
    private readonly weightedStrategy: WeightedScoringStrategy,
    private readonly judgeStrategy: JudgeModelStrategy,
    private readonly hybridStrategy: HybridSafeStrategy,
    private readonly policiesService: PoliciesService,
    private readonly auditService: AuditService,
    private readonly reviewQueueService: ReviewQueueService,
  ) {}

  async evaluateCandidates(
    dto: EvaluateCandidatesDto,
    headerTenantId?: string,
    headerWorkspaceId?: string,
  ): Promise<DecisionRecord> {
    const startTime = Date.now();
    const tenantId = dto.tenantId || headerTenantId || 'default-tenant';
    const workspaceId = dto.workspaceId || headerWorkspaceId || 'default-workspace';
    const requestId = dto.requestId || `req-${uuidv4().slice(0, 8)}`;
    const decisionId = `dec-${uuidv4()}`;

    // 1. Boundary & Input Checks
    if (!dto.candidates || dto.candidates.length === 0) {
      throw new BadRequestException('At least one candidate response must be provided.');
    }
    if (dto.candidates.length > 10) {
      throw new BadRequestException('Maximum candidate count per evaluation request is 10.');
    }

    // SSRF prevention: ensure evidence documents are structured data, not arbitrary internal URLs
    const evidenceDocs = dto.evidenceDocuments || [];
    for (const doc of evidenceDocs) {
      if (doc.uri && (doc.uri.includes('localhost') || doc.uri.includes('127.0.0.1') || doc.uri.includes('169.254.'))) {
        throw new BadRequestException('Disallowed evidence URI: internal network and loopback addresses are prohibited.');
      }
    }

    // 2. Resolve Policy
    const policyId = dto.policyId || 'strict-financial-v1';
    const policy = await this.policiesService.getPolicy(policyId, tenantId);

    // 3. Resolve Strategy
    const strategyType: ArbitrationStrategyType = dto.strategy || policy.strategy || 'HYBRID_SAFE';

    // 4. Run Deterministic Evaluations
    const deterministicChecks: Record<string, DeterministicCheckResult> = {};
    for (const cand of dto.candidates) {
      deterministicChecks[cand.candidateId] = this.deterministicEvaluator.evaluate(
        cand,
        policy,
        dto.expectedSchema,
        dto.requiredFields,
        dto.canonicalAnswer,
      );
    }

    // 5. Run Evidence Evaluations
    const evidenceChecks: Record<string, EvidenceCheckResult> = {};
    for (const cand of dto.candidates) {
      evidenceChecks[cand.candidateId] = this.evidenceEvaluator.evaluate(
        cand,
        dto.candidates,
        evidenceDocs,
        policy,
      );
    }

    // 6. Execute Selected Arbitration Strategy
    let strategyResult;
    switch (strategyType) {
      case 'DETERMINISTIC_RULES':
        strategyResult = await this.deterministicStrategy.execute(
          dto.candidates,
          deterministicChecks,
          evidenceChecks,
          policy,
        );
        break;
      case 'WEIGHTED_SCORING':
        strategyResult = await this.weightedStrategy.execute(
          dto.candidates,
          deterministicChecks,
          evidenceChecks,
          policy,
        );
        break;
      case 'JUDGE_MODEL_ASSESSMENT':
        strategyResult = await this.judgeStrategy.execute(
          dto.candidates,
          deterministicChecks,
          evidenceChecks,
          policy,
          {
            task: dto.task,
            evidenceContext: evidenceDocs.map((e) => `[${e.sourceId}] ${e.content}`).join('\n\n'),
          },
        );
        break;
      case 'HYBRID_SAFE':
      default:
        strategyResult = await this.hybridStrategy.execute(
          dto.candidates,
          deterministicChecks,
          evidenceChecks,
          policy,
        );
        break;
    }

    // 7. Calculate Aggregates
    const executionDuration = Date.now() - startTime;
    const totalCost = dto.candidates.reduce((sum, c) => sum + (c.costUsd || 0), 0);
    const chosenCandidate = strategyResult.chosenCandidateId
      ? dto.candidates.find((c) => c.candidateId === strategyResult.chosenCandidateId)
      : undefined;

    const recordData: Omit<DecisionRecord, 'signatureHash'> = {
      decisionId,
      tenantId,
      workspaceId,
      requestId,
      task: dto.task,
      policyId: policy.policyId,
      policyVersion: policy.version,
      strategy: strategyType,
      outcome: strategyResult.outcome,
      chosenCandidateId: strategyResult.chosenCandidateId,
      chosenCandidate,
      abstentionReason: strategyResult.abstentionReason,
      escalationReason: strategyResult.escalationReason,
      candidates: dto.candidates,
      deterministicChecks,
      evidenceChecks,
      scores: strategyResult.scores,
      strategyDetails: strategyResult.strategyDetails,
      executionMetrics: {
        totalLatencyMs: executionDuration,
        totalCostUsd: Math.round(totalCost * 10000) / 10000,
        evaluatedCandidatesCount: dto.candidates.length,
        isSimulated: Boolean(dto.isSimulated),
      },
      timestamp: new Date().toISOString(),
    };

    // 8. Record Immutable Decision
    const decisionRecord = await this.auditService.recordDecision(recordData);

    // 9. If outcome is abstained or escalated, enqueue for human review
    if (
      strategyResult.outcome === 'ESCALATED_TO_HUMAN_REVIEW' ||
      strategyResult.outcome === 'ABSTAINED'
    ) {
      await this.reviewQueueService.enqueueForReview(
        decisionRecord,
        strategyResult.escalationReason || 'LOW_CONFIDENCE',
        strategyResult.abstentionReason || 'Outcome triggered calibrated abstention or human review queue.',
      );
    }

    return decisionRecord;
  }
}
