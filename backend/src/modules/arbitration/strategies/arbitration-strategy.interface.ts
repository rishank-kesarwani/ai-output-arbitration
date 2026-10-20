import {
  CandidateResponse,
  DeterministicCheckResult,
  EvidenceCheckResult,
  ArbitrationPolicy,
  CandidateScoreBreakdown,
  StrategyExecutionDetails,
  ArbitrationOutcome,
  EscalationReason,
} from '../../../common/types';

export interface StrategyResult {
  outcome: ArbitrationOutcome;
  chosenCandidateId?: string;
  scores: Record<string, CandidateScoreBreakdown>;
  strategyDetails: StrategyExecutionDetails;
  abstentionReason?: string;
  escalationReason?: EscalationReason;
}

export interface IArbitrationStrategy {
  execute(
    candidates: CandidateResponse[],
    deterministicChecks: Record<string, DeterministicCheckResult>,
    evidenceChecks: Record<string, EvidenceCheckResult>,
    policy: ArbitrationPolicy,
    extraContext?: Record<string, any>,
  ): Promise<StrategyResult>;
}
