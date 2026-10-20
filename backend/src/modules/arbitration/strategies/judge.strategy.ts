import { Injectable } from '@nestjs/common';
import {
  CandidateResponse,
  DeterministicCheckResult,
  EvidenceCheckResult,
  ArbitrationPolicy,
  CandidateScoreBreakdown,
  StrategyExecutionDetails,
} from '../../../common/types';
import {
  IArbitrationStrategy,
  StrategyResult,
} from './arbitration-strategy.interface';
import { AiPlatformClient } from '../../integrations/ai-platform.client';

@Injectable()
export class JudgeModelStrategy implements IArbitrationStrategy {
  constructor(private readonly aiClient: AiPlatformClient) {}

  async execute(
    candidates: CandidateResponse[],
    deterministicChecks: Record<string, DeterministicCheckResult>,
    evidenceChecks: Record<string, EvidenceCheckResult>,
    policy: ArbitrationPolicy,
    extraContext?: Record<string, any>,
  ): Promise<StrategyResult> {
    const scores: Record<string, CandidateScoreBreakdown> = {};

    // First gate: Check for hard disqualifications (e.g. policy violations or schema failure)
    const eligibleCandidates = candidates.filter((c) => {
      const dCheck = deterministicChecks[c.candidateId];
      const eCheck = evidenceChecks[c.candidateId];
      return dCheck.passed && (!policy.disallowPhantomCitations || eCheck.referenceResolution.phantomCitations.length === 0);
    });

    if (eligibleCandidates.length === 0) {
      for (const c of candidates) {
        scores[c.candidateId] = {
          candidateId: c.candidateId,
          deterministicScore: 0,
          evidenceScore: 0,
          policyScore: 0,
          costEfficiencyScore: 0,
          latencyEfficiencyScore: 0,
          judgeScore: 0,
          finalWeightedScore: 0,
          disqualified: true,
          disqualificationReason: 'Violated pre-judge deterministic safety constraints.',
        };
      }

      return {
        outcome: 'REJECTED',
        scores,
        strategyDetails: {
          strategy: 'JUDGE_MODEL_ASSESSMENT',
          weightsApplied: {
            schemaAndFormat: 0.2,
            evidenceSupport: 0.3,
            policyCompliance: 0.2,
            costEfficiency: 0.05,
            latencyEfficiency: 0.05,
            judgeAssessment: 0.2,
          },
          missingSignals: ['Passing deterministic candidates'],
          limitationsDisclaimer:
            'Judge-model assessment is heuristic and subjective; it does NOT constitute mathematical proof of factual correctness or ground truth.',
        },
        abstentionReason: 'All candidates disqualified by deterministic gate prior to LLM-judge invocation.',
        escalationReason: 'ALL_CANDIDATES_DISQUALIFIED',
      };
    }

    // Call Judge Model via AI Platform Client
    const judgePromptContext = eligibleCandidates
      .map(
        (c, idx) =>
          `[Candidate ${idx + 1} (ID: ${c.candidateId}, Model: ${c.modelId})]:\n${c.output.slice(0, 1000)}`,
      )
      .join('\n\n');

    const judgeRes = await this.aiClient.evaluateWithJudge({
      task: extraContext?.task || 'Evaluate candidate outputs for factual alignment and quality',
      candidateA: judgePromptContext,
      evidenceContext: extraContext?.evidenceContext || 'See provided candidate citations',
    });

    for (const cand of candidates) {
      const dCheck = deterministicChecks[cand.candidateId];
      const eCheck = evidenceChecks[cand.candidateId];
      const isEligible = eligibleCandidates.some((ec) => ec.candidateId === cand.candidateId);

      const judgeScore = isEligible ? judgeRes.judgeConfidence : 0.2;
      const evidenceScore = eCheck.sourceSupport.supportScore;

      const finalWeightedScore = isEligible
        ? Math.round((judgeScore * 0.4 + evidenceScore * 0.4 + (dCheck.passed ? 0.2 : 0)) * 1000) / 1000
        : 0.1;

      scores[cand.candidateId] = {
        candidateId: cand.candidateId,
        deterministicScore: dCheck.passed ? 1.0 : 0.0,
        evidenceScore,
        policyScore: dCheck.policyCheck.passed ? 1.0 : 0.0,
        costEfficiencyScore: 0.8,
        latencyEfficiencyScore: 0.8,
        judgeScore,
        finalWeightedScore,
        disqualified: !isEligible,
        disqualificationReason: dCheck.disqualificationReason || eCheck.disqualificationReason,
      };
    }

    // Pick candidate with highest final score
    const bestCandidate = [...eligibleCandidates].sort((a, b) => {
      return (scores[b.candidateId]?.finalWeightedScore || 0) - (scores[a.candidateId]?.finalWeightedScore || 0);
    })[0];

    const strategyDetails: StrategyExecutionDetails = {
      strategy: 'JUDGE_MODEL_ASSESSMENT',
      weightsApplied: {
        schemaAndFormat: 0.2,
        evidenceSupport: 0.4,
        policyCompliance: 0.1,
        costEfficiency: 0.05,
        latencyEfficiency: 0.05,
        judgeAssessment: 0.2,
      },
      missingSignals: ['Direct mathematical proof of truth'],
      limitationsDisclaimer:
        'CRITICAL LIMITATION: Judge-model assessment is heuristic and subjective. LLM-judge scores do NOT guarantee factual correctness, and agreement among LLMs is not proof of truth.',
      judgeRationale: judgeRes.reasoning,
    };

    if (!bestCandidate || scores[bestCandidate.candidateId].finalWeightedScore < policy.minConfidenceThreshold) {
      return {
        outcome: 'ESCALATED_TO_HUMAN_REVIEW',
        scores,
        strategyDetails,
        abstentionReason: `Judge confidence combined with evidence score (${
          scores[bestCandidate?.candidateId || '']?.finalWeightedScore || 0
        }) is below required confidence threshold (${policy.minConfidenceThreshold}).`,
        escalationReason: 'LOW_CONFIDENCE',
      };
    }

    return {
      outcome: 'SELECTED',
      chosenCandidateId: bestCandidate.candidateId,
      scores,
      strategyDetails,
    };
  }
}
