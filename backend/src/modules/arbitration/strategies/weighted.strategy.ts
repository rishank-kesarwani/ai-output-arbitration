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

@Injectable()
export class WeightedScoringStrategy implements IArbitrationStrategy {
  async execute(
    candidates: CandidateResponse[],
    deterministicChecks: Record<string, DeterministicCheckResult>,
    evidenceChecks: Record<string, EvidenceCheckResult>,
    policy: ArbitrationPolicy,
  ): Promise<StrategyResult> {
    const scores: Record<string, CandidateScoreBreakdown> = {};

    // Determine min/max for cost and latency normalization
    const costs = candidates.map((c) => c.costUsd || 0.001);
    const latencies = candidates.map((c) => c.latencyMs || 100);

    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);

    const weights = policy.weights || {
      schemaAndFormat: 0.25,
      evidenceSupport: 0.35,
      policyCompliance: 0.2,
      costEfficiency: 0.1,
      latencyEfficiency: 0.1,
    };

    let missingEvidenceDetected = false;
    let anyContradictions = false;

    for (const cand of candidates) {
      const dCheck = deterministicChecks[cand.candidateId];
      const eCheck = evidenceChecks[cand.candidateId];

      if (eCheck.sourceSupport.hasMissingEvidence) {
        missingEvidenceDetected = true;
      }
      if (
        eCheck.contradictionFlags.contradictsSource ||
        eCheck.contradictionFlags.contradictsOtherCandidates
      ) {
        anyContradictions = true;
      }

      // Schema score: 1.0 if passed schema and required fields, 0.5 if warnings, 0.0 if failed
      let schemaScore = 0.0;
      if (dCheck.jsonSchemaCheck.passed && dCheck.requiredFieldsCheck.passed) {
        schemaScore = 1.0;
      } else if (dCheck.requiredFieldsCheck.passed) {
        schemaScore = 0.3;
      }

      // Policy score: 1.0 if no forbidden terms, 0.0 if forbidden terms
      const policyScore = dCheck.policyCheck.passed ? 1.0 : 0.0;

      // Evidence score: real measured source support score (CRITICAL: 0 if missing evidence)
      const evidenceScore = eCheck.sourceSupport.supportScore;

      // Cost efficiency score (lower cost = higher score)
      const costRange = maxCost - minCost;
      const costScore =
        costRange > 0
          ? Math.max(0, 1 - (cand.costUsd - minCost) / costRange)
          : 1.0;

      // Latency efficiency score (lower latency = higher score)
      const latencyRange = maxLatency - minLatency;
      const latencyScore =
        latencyRange > 0
          ? Math.max(0, 1 - (cand.latencyMs - minLatency) / latencyRange)
          : 1.0;

      const isDisqualified =
        (policy.strictSchemaValidation && !dCheck.jsonSchemaCheck.passed) ||
        (policy.disallowPhantomCitations &&
          eCheck.referenceResolution.phantomCitations.length > 0) ||
        !dCheck.policyCheck.passed;

      let weightedSum =
        schemaScore * weights.schemaAndFormat +
        evidenceScore * weights.evidenceSupport +
        policyScore * weights.policyCompliance +
        costScore * weights.costEfficiency +
        latencyScore * weights.latencyEfficiency;

      if (isDisqualified) {
        weightedSum = Math.min(weightedSum, 0.2);
      }

      const finalWeightedScore = Math.round(weightedSum * 1000) / 1000;

      scores[cand.candidateId] = {
        candidateId: cand.candidateId,
        deterministicScore: schemaScore,
        evidenceScore,
        policyScore,
        costEfficiencyScore: Math.round(costScore * 100) / 100,
        latencyEfficiencyScore: Math.round(latencyScore * 100) / 100,
        finalWeightedScore,
        disqualified: isDisqualified,
        disqualificationReason:
          dCheck.disqualificationReason || eCheck.disqualificationReason,
      };
    }

    const missingSignals: string[] = [];
    if (missingEvidenceDetected) {
      missingSignals.push('Verified ground truth evidence documents');
    }
    if (candidates.some((c) => c.confidenceScore === undefined)) {
      missingSignals.push('Model self-reported token logprobs / confidence');
    }

    const strategyDetails: StrategyExecutionDetails = {
      strategy: 'WEIGHTED_SCORING',
      weightsApplied: weights,
      missingSignals,
      limitationsDisclaimer:
        'Weighted scoring aggregates multi-objective utility into a scalar index. High cost/latency efficiency CANNOT compensate for unverified evidence or factual contradictions. Agreement between models is NOT proof of ground truth.',
    };

    // Sort by weighted score descending
    const rankedCandidates = [...candidates].sort((a, b) => {
      const scoreA = scores[a.candidateId]?.finalWeightedScore || 0;
      const scoreB = scores[b.candidateId]?.finalWeightedScore || 0;
      return scoreB - scoreA;
    });

    const topCandidate = rankedCandidates[0];
    const topScore = scores[topCandidate.candidateId]?.finalWeightedScore || 0;

    // Check calibrated abstention conditions
    if (policy.requireEvidence && missingEvidenceDetected) {
      return {
        outcome: 'ABSTAINED',
        scores,
        strategyDetails,
        abstentionReason:
          'Calibrated Abstention: Required source evidence is missing. System refuses to assume factual correctness from unverified candidate claims.',
        escalationReason: 'MISSING_EVIDENCE',
      };
    }

    if (anyContradictions && topScore < 0.85) {
      return {
        outcome: 'ESCALATED_TO_HUMAN_REVIEW',
        scores,
        strategyDetails,
        abstentionReason:
          'Contradictions detected between candidate assertions; confidence below escalation threshold. Queued for human review.',
        escalationReason: 'CONTRADICTORY_CANDIDATES',
      };
    }

    if (topScore < policy.minConfidenceThreshold) {
      return {
        outcome: 'ABSTAINED',
        scores,
        strategyDetails,
        abstentionReason: `Calibrated Abstention: Highest score (${topScore}) is below required policy threshold (${policy.minConfidenceThreshold}).`,
        escalationReason: 'LOW_CONFIDENCE',
      };
    }

    if (scores[topCandidate.candidateId]?.disqualified) {
      return {
        outcome: 'REJECTED',
        scores,
        strategyDetails,
        abstentionReason:
          'All top candidates were disqualified due to strict safety or schema violations.',
        escalationReason: 'ALL_CANDIDATES_DISQUALIFIED',
      };
    }

    return {
      outcome: 'SELECTED',
      chosenCandidateId: topCandidate.candidateId,
      scores,
      strategyDetails,
    };
  }
}
