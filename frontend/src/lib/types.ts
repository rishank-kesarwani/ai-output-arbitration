export type ArbitrationOutcome =
  | 'SELECTED'
  | 'ABSTAINED'
  | 'REJECTED'
  | 'ESCALATED_TO_HUMAN_REVIEW';

export type ArbitrationStrategyType =
  | 'DETERMINISTIC_RULES'
  | 'WEIGHTED_SCORING'
  | 'JUDGE_MODEL_ASSESSMENT'
  | 'HYBRID_SAFE';

export type EscalationReason =
  | 'UNSUPPORTED_CLAIMS'
  | 'CONTRADICTORY_CANDIDATES'
  | 'MISSING_EVIDENCE'
  | 'LOW_CONFIDENCE'
  | 'SCHEMA_VIOLATION'
  | 'POLICY_VIOLATION'
  | 'ALL_CANDIDATES_DISQUALIFIED'
  | 'MANUAL_ESCALATION_TRIGGER';

export interface Citation {
  citationId: string;
  sourceId: string;
  uri?: string;
  title?: string;
  claimedFact?: string;
  sourceExcerpt?: string;
}

export interface EvidenceDocument {
  sourceId: string;
  title: string;
  uri?: string;
  content: string;
  version?: string;
  lastUpdated?: string;
}

export interface CandidateResponse {
  candidateId: string;
  modelId: string;
  output: string;
  parsedOutput?: Record<string, any>;
  citations?: Citation[];
  confidenceScore?: number;
  latencyMs: number;
  costUsd: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  isSimulated?: boolean;
}

export interface CheckViolation {
  field?: string;
  checkType: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING';
}

export interface DeterministicCheckResult {
  candidateId: string;
  passed: boolean;
  requiredFieldsCheck: { passed: boolean; missingFields: string[] };
  jsonSchemaCheck: { passed: boolean; violations: CheckViolation[] };
  typeConstraintsCheck: { passed: boolean; violations: CheckViolation[] };
  policyCheck: { passed: boolean; forbiddenTermsFound: string[]; safetyPassed: boolean };
  exactMatchCheck?: { passed: boolean; similarityScore?: number };
  disqualificationReason?: string;
}

export interface EvidenceCheckResult {
  candidateId: string;
  passed: boolean;
  citationPresence: { required: boolean; present: boolean };
  referenceResolution: {
    totalCitations: number;
    resolvedCitations: number;
    phantomCitations: string[];
  };
  sourceSupport: {
    supportScore: number;
    hasMissingEvidence: boolean;
    unsupportedFacts: string[];
    verifiedCitations: string[];
  };
  contradictionFlags: {
    contradictsSource: boolean;
    contradictsOtherCandidates: boolean;
    conflictingDetails: string[];
  };
  disqualificationReason?: string;
}

export interface CandidateScoreBreakdown {
  candidateId: string;
  deterministicScore: number;
  evidenceScore: number;
  policyScore: number;
  costEfficiencyScore: number;
  latencyEfficiencyScore: number;
  judgeScore?: number;
  finalWeightedScore: number;
  disqualified: boolean;
  disqualificationReason?: string;
}

export interface StrategyExecutionDetails {
  strategy: ArbitrationStrategyType;
  weightsApplied: {
    schemaAndFormat: number;
    evidenceSupport: number;
    policyCompliance: number;
    costEfficiency: number;
    latencyEfficiency: number;
    judgeAssessment?: number;
  };
  missingSignals: string[];
  limitationsDisclaimer: string;
  judgeRationale?: string;
}

export interface DecisionRecord {
  decisionId: string;
  tenantId: string;
  workspaceId: string;
  requestId: string;
  task: string;
  policyId: string;
  policyVersion: number;
  strategy: ArbitrationStrategyType;
  outcome: ArbitrationOutcome;
  chosenCandidateId?: string;
  chosenCandidate?: CandidateResponse;
  abstentionReason?: string;
  escalationReason?: EscalationReason;
  candidates: CandidateResponse[];
  deterministicChecks: Record<string, DeterministicCheckResult>;
  evidenceChecks: Record<string, EvidenceCheckResult>;
  scores: Record<string, CandidateScoreBreakdown>;
  strategyDetails: StrategyExecutionDetails;
  executionMetrics: {
    totalLatencyMs: number;
    totalCostUsd: number;
    evaluatedCandidatesCount: number;
    isSimulated: boolean;
  };
  signatureHash: string;
  timestamp: string;
}

export interface HumanReviewItem {
  reviewId: string;
  decisionId: string;
  tenantId: string;
  workspaceId: string;
  requestId: string;
  task: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'OVERRIDDEN';
  escalationReason: EscalationReason;
  escalationDetails: string;
  decisionRecord: DecisionRecord;
  reviewerId?: string;
  resolutionComment?: string;
  overriddenCandidateId?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ArbitrationPolicy {
  policyId: string;
  version: number;
  tenantId: string;
  name: string;
  description: string;
  strategy: ArbitrationStrategyType;
  minConfidenceThreshold: number;
  requireEvidence: boolean;
  disallowPhantomCitations: boolean;
  disallowContradictions: boolean;
  strictSchemaValidation: boolean;
  forbiddenKeywords: string[];
  weights: {
    schemaAndFormat: number;
    evidenceSupport: number;
    policyCompliance: number;
    costEfficiency: number;
    latencyEfficiency: number;
    judgeAssessment?: number;
  };
  updatedAt: string;
}

export interface AggregateMetrics {
  totalEvaluations: number;
  selectedCount: number;
  abstainedCount: number;
  rejectedCount: number;
  escalatedToReviewCount: number;
  averageLatencyMs: number;
  totalCostUsd: number;
  simulatedEvaluationsCount: number;
  realEvaluationsCount: number;
}
