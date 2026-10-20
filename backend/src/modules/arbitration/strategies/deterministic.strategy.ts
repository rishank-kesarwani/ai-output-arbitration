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
export class DeterministicRulesStrategy implements IArbitrationStrategy {
  async execute(
    candidates: CandidateResponse[],
    deterministicChecks: Record<string, DeterministicCheckResult>,
    evidenceChecks: Record<string, EvidenceCheckResult>,
    policy: ArbitrationPolicy,
  ): Promise<StrategyResult> {
    const scores: Record<string, CandidateScoreBreakdown> = {};
    const eligibleCandidateIds: string[] = [];

    let hasContradictions = false;
    let missingEvidenceDetected = false;

    for (const cand of candidates) {
      const dCheck = deterministicChecks[cand.candidateId];
      const eCheck = evidenceChecks[cand.candidateId];

      const deterministicScore = dCheck.passed ? 1.0 : 0.0;
      const evidenceScore = eCheck.passed ? eCheck.sourceSupport.supportScore : 0.0;
      const policyScore = dCheck.policyCheck.passed ? 1.0 : 0.0;

      if (eCheck.contradictionFlags.contradictsSource || eCheck.contradictionFlags.contradictsOtherCandidates) {
        hasContradictions = true;
      }
      if (eCheck.sourceSupport.hasMissingEvidence) {
        missingEvidenceDetected = true;
      }

      const isDisqualified = !dCheck.passed || !eCheck.passed;
      const disqualificationReason = dCheck.disqualificationReason || eCheck.disqualificationReason;

      // Score: 1.0 if fully compliant, 0.0 otherwise
      const finalScore = isDisqualified ? 0.0 : 1.0;

      scores[cand.candidateId] = {
        candidateId: cand.candidateId,
        deterministicScore,
        evidenceScore,
        policyScore,
        costEfficiencyScore: 1.0, // not weighted in pure deterministic
        latencyEfficiencyScore: 1.0,
        finalWeightedScore: finalScore,
        disqualified: isDisqualified,
        disqualificationReason,
      };

      if (!isDisqualified) {
        eligibleCandidateIds.push(cand.candidateId);
      }
    }

    const strategyDetails: StrategyExecutionDetails = {
      strategy: 'DETERMINISTIC_RULES',
      weightsApplied: {
        schemaAndFormat: 1.0,
        evidenceSupport: 1.0,
        policyCompliance: 1.0,
        costEfficiency: 0.0,
        latencyEfficiency: 0.0,
      },
      missingSignals: [
        missingEvidenceDetected ? 'Ground truth evidence documents' : '',
        'Subjective judge nuance',
      ].filter(Boolean),
      limitationsDisclaimer:
        'Deterministic rules require explicit criteria. They do not evaluate stylistic fluidity, subjective clarity, or unmodeled semantic context.',
    };

    // If missing evidence was encountered for all or required
    if (missingEvidenceDetected && eligibleCandidateIds.length === 0) {
      return {
        outcome: 'ABSTAINED',
        scores,
        strategyDetails,
        abstentionReason:
          'Calibrated Abstention: Required source evidence is missing. System refuses to assume factual correctness from unverified candidate claims.',
        escalationReason: 'MISSING_EVIDENCE',
      };
    }

    // If mutual contradictions exist across candidates and no clear winner
    if (hasContradictions && eligibleCandidateIds.length === 0) {
      return {
        outcome: 'ESCALATED_TO_HUMAN_REVIEW',
        scores,
        strategyDetails,
        abstentionReason:
          'Severe factual contradiction detected between candidate responses or with evidence. Escalated for human adjudication.',
        escalationReason: 'CONTRADICTORY_CANDIDATES',
      };
    }

    if (eligibleCandidateIds.length === 0) {
      return {
        outcome: 'REJECTED',
        scores,
        strategyDetails,
        abstentionReason:
          'All candidate responses violated deterministic schema, safety, or citation constraints.',
        escalationReason: 'ALL_CANDIDATES_DISQUALIFIED',
      };
    }

    // Tie-breaker among eligible candidates: lowest cost, then lowest latency
    eligibleCandidateIds.sort((aId, bId) => {
      const candA = candidates.find((c) => c.candidateId === aId)!;
      const candB = candidates.find((c) => c.candidateId === bId)!;
      if (candA.costUsd !== candB.costUsd) {
        return candA.costUsd - candB.costUsd;
      }
      return candA.latencyMs - candB.latencyMs;
    });

    const chosenId = eligibleCandidateIds[0];

    return {
      outcome: 'SELECTED',
      chosenCandidateId: chosenId,
      scores,
      strategyDetails,
    };
  }
}
