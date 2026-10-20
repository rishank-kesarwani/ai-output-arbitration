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
import { WeightedScoringStrategy } from './weighted.strategy';

@Injectable()
export class HybridSafeStrategy implements IArbitrationStrategy {
  constructor(private readonly weightedStrategy: WeightedScoringStrategy) {}

  async execute(
    candidates: CandidateResponse[],
    deterministicChecks: Record<string, DeterministicCheckResult>,
    evidenceChecks: Record<string, EvidenceCheckResult>,
    policy: ArbitrationPolicy,
    extraContext?: Record<string, any>,
  ): Promise<StrategyResult> {
    // Stage 1: Deterministic Filter Gate
    const passingCandidates = candidates.filter((c) => {
      const dCheck = deterministicChecks[c.candidateId];
      const eCheck = evidenceChecks[c.candidateId];

      const passedFormat = dCheck.jsonSchemaCheck.passed && dCheck.requiredFieldsCheck.passed;
      const passedPolicy = dCheck.policyCheck.passed;
      const passedPhantomCheck = !policy.disallowPhantomCitations || eCheck.referenceResolution.phantomCitations.length === 0;

      return passedFormat && passedPolicy && passedPhantomCheck;
    });

    // If zero candidates survive the deterministic filter
    if (passingCandidates.length === 0) {
      const scores: Record<string, CandidateScoreBreakdown> = {};
      for (const c of candidates) {
        const dCheck = deterministicChecks[c.candidateId];
        const eCheck = evidenceChecks[c.candidateId];
        scores[c.candidateId] = {
          candidateId: c.candidateId,
          deterministicScore: dCheck.passed ? 1.0 : 0.0,
          evidenceScore: eCheck.sourceSupport.supportScore,
          policyScore: dCheck.policyCheck.passed ? 1.0 : 0.0,
          costEfficiencyScore: 0,
          latencyEfficiencyScore: 0,
          finalWeightedScore: 0,
          disqualified: true,
          disqualificationReason: dCheck.disqualificationReason || eCheck.disqualificationReason,
        };
      }

      return {
        outcome: 'REJECTED',
        scores,
        strategyDetails: {
          strategy: 'HYBRID_SAFE',
          weightsApplied: policy.weights,
          missingSignals: ['Passing candidates from deterministic gate'],
          limitationsDisclaimer:
            'Hybrid Safe strategy enforces a strict deterministic safety gate before scoring. All candidates failed Stage 1.',
        },
        abstentionReason: 'All candidates rejected by deterministic safety & format gate in Stage 1.',
        escalationReason: 'ALL_CANDIDATES_DISQUALIFIED',
      };
    }

    // Stage 2: Weighted Multi-Objective Scoring on survivors
    const weightedResult = await this.weightedStrategy.execute(
      passingCandidates,
      deterministicChecks,
      evidenceChecks,
      policy,
    );

    // Merge in disqualified candidates scores
    const fullScores = { ...weightedResult.scores };
    for (const c of candidates) {
      if (!fullScores[c.candidateId]) {
        const dCheck = deterministicChecks[c.candidateId];
        const eCheck = evidenceChecks[c.candidateId];
        fullScores[c.candidateId] = {
          candidateId: c.candidateId,
          deterministicScore: dCheck.passed ? 1.0 : 0.0,
          evidenceScore: eCheck.sourceSupport.supportScore,
          policyScore: dCheck.policyCheck.passed ? 1.0 : 0.0,
          costEfficiencyScore: 0,
          latencyEfficiencyScore: 0,
          finalWeightedScore: 0,
          disqualified: true,
          disqualificationReason: dCheck.disqualificationReason || eCheck.disqualificationReason,
        };
      }
    }

    return {
      ...weightedResult,
      scores: fullScores,
      strategyDetails: {
        ...weightedResult.strategyDetails,
        strategy: 'HYBRID_SAFE',
        limitationsDisclaimer:
          'Hybrid Safe combines strict deterministic filtering (syntax, safety, phantom citations) with calibrated weighted utility. Majority agreement does not override missing evidence.',
      },
    };
  }
}
