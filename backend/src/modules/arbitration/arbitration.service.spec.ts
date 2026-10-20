import { Test, TestingModule } from '@nestjs/testing';
import { ArbitrationService } from './arbitration.service';
import { DeterministicEvaluator } from './evaluators/deterministic.evaluator';
import { EvidenceEvaluator } from './evaluators/evidence.evaluator';
import { DeterministicRulesStrategy } from './strategies/deterministic.strategy';
import { WeightedScoringStrategy } from './strategies/weighted.strategy';
import { JudgeModelStrategy } from './strategies/judge.strategy';
import { HybridSafeStrategy } from './strategies/hybrid.strategy';
import { PoliciesService } from '../policies/policies.service';
import { AuditService } from '../audit/audit.service';
import { ReviewQueueService } from '../review-queue/review-queue.service';
import { AiPlatformClient } from '../integrations/ai-platform.client';
import { NotificationServiceClient } from '../integrations/notification.client';
import { ConfigService } from '@nestjs/config';

describe('ArbitrationService', () => {
  let service: ArbitrationService;
  let auditService: AuditService;
  let reviewQueueService: ReviewQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArbitrationService,
        DeterministicEvaluator,
        EvidenceEvaluator,
        DeterministicRulesStrategy,
        WeightedScoringStrategy,
        JudgeModelStrategy,
        HybridSafeStrategy,
        PoliciesService,
        AuditService,
        ReviewQueueService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, def) => def),
          },
        },
        {
          provide: AiPlatformClient,
          useValue: {
            evaluateWithJudge: jest.fn().mockResolvedValue({
              judgeConfidence: 0.9,
              reasoning: 'AI judge approved factual alignment.',
              limitations: 'Subjective heuristic',
            }),
          },
        },
        {
          provide: NotificationServiceClient,
          useValue: {
            sendReviewEscalationAlert: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<ArbitrationService>(ArbitrationService);
    auditService = module.get<AuditService>(AuditService);
    reviewQueueService = module.get<ReviewQueueService>(ReviewQueueService);
  });

  it('should select the grounded candidate and disqualify the one with phantom citations', async () => {
    const result = await service.evaluateCandidates(
      {
        task: 'Extract Q3 net income',
        policyId: 'strict-financial-v1',
        strategy: 'HYBRID_SAFE',
        evidenceDocuments: [
          {
            sourceId: 'doc-real-1',
            title: '10-K Report',
            content: 'Net income reached $45.2 million in Q3.',
          },
        ],
        candidates: [
          {
            candidateId: 'cand-true',
            modelId: 'gemini-1.5-pro',
            output: 'Acme Corp recorded net income of $45.2 million in Q3.',
            latencyMs: 350,
            costUsd: 0.002,
            citations: [{ citationId: 'c1', sourceId: 'doc-real-1' }],
          },
          {
            candidateId: 'cand-phantom',
            modelId: 'gpt-4o',
            output: 'Acme Corp net income was $99.9 million in Q3.',
            latencyMs: 450,
            costUsd: 0.004,
            citations: [{ citationId: 'c2', sourceId: 'doc-hallucinated-phantom' }],
          },
        ],
      },
      'tenant-test',
    );

    expect(result.outcome).toBe('SELECTED');
    expect(result.chosenCandidateId).toBe('cand-true');
    expect(result.scores['cand-phantom'].disqualified).toBe(true);
    expect(result.scores['cand-phantom'].disqualificationReason).toContain('Phantom citations detected');
    expect(result.signatureHash).toBeDefined();
    expect(result.signatureHash.length).toBe(64); // SHA-256 hex
  });

  it('CRITICAL: should trigger calibrated abstention when evidence is missing, even if all models agree', async () => {
    const result = await service.evaluateCandidates(
      {
        task: 'Verify historical treaty ratification date',
        policyId: 'strict-financial-v1', // Requires evidence
        evidenceDocuments: [], // MISSING EVIDENCE
        candidates: [
          {
            candidateId: 'cand-1',
            modelId: 'model-a',
            output: 'The treaty was signed on October 14, 2024.',
            latencyMs: 300,
            costUsd: 0.001,
          },
          {
            candidateId: 'cand-2',
            modelId: 'model-b',
            output: 'The treaty was signed on October 14, 2024.',
            latencyMs: 310,
            costUsd: 0.001,
          },
        ],
      },
      'tenant-test',
    );

    // Consensus must NOT be accepted as proof of truth when evidence is missing!
    expect(result.outcome).toBe('ABSTAINED');
    expect(result.escalationReason).toBe('MISSING_EVIDENCE');
    expect(result.abstentionReason).toContain('Required source evidence is missing');

    // And it should have enqueued item in the review queue
    const pendingReviews = await reviewQueueService.getPending('tenant-test');
    expect(pendingReviews.length).toBeGreaterThan(0);
  });

  it('should reject when candidate count exceeds maximum limit of 10', async () => {
    const excessCandidates = Array.from({ length: 11 }, (_, i) => ({
      candidateId: `cand-${i}`,
      modelId: 'model-x',
      output: `Output ${i}`,
      latencyMs: 100,
      costUsd: 0.001,
    }));

    await expect(
      service.evaluateCandidates(
        {
          task: 'Too many candidates test',
          candidates: excessCandidates,
        },
        'tenant-test',
      ),
    ).rejects.toThrow('Maximum candidate count per evaluation request is 10');
  });
});
