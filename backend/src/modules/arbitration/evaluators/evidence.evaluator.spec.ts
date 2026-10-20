import { EvidenceEvaluator } from './evidence.evaluator';
import { ArbitrationPolicy, CandidateResponse, EvidenceDocument } from '../../../common/types';

describe('EvidenceEvaluator', () => {
  let evaluator: EvidenceEvaluator;

  const strictEvidencePolicy: ArbitrationPolicy = {
    policyId: 'strict-evidence-policy',
    version: 1,
    tenantId: 'test-tenant',
    name: 'Strict Evidence Policy',
    description: 'Requires verified evidence',
    strategy: 'HYBRID_SAFE',
    minConfidenceThreshold: 0.8,
    requireEvidence: true,
    disallowPhantomCitations: true,
    disallowContradictions: true,
    strictSchemaValidation: false,
    forbiddenKeywords: [],
    weights: {
      schemaAndFormat: 0.2,
      evidenceSupport: 0.5,
      policyCompliance: 0.1,
      costEfficiency: 0.1,
      latencyEfficiency: 0.1,
    },
    updatedAt: new Date().toISOString(),
  };

  const sampleEvidence: EvidenceDocument[] = [
    {
      sourceId: 'doc-sec-1',
      title: 'Q3 Financial Filing',
      content: 'Acme Corp recorded operating revenue of $128.4 million and net income of $45.2 million in Q3 2024.',
      version: '1.0',
    },
  ];

  beforeEach(() => {
    evaluator = new EvidenceEvaluator();
  });

  it('should verify candidate with valid citations matching source content', () => {
    const candidate: CandidateResponse = {
      candidateId: 'cand-valid',
      modelId: 'gemini-1.5-pro',
      output: 'Acme Corp recorded operating revenue of $128.4 million and net income of $45.2 million.',
      latencyMs: 350,
      costUsd: 0.002,
      citations: [
        {
          citationId: 'cit-1',
          sourceId: 'doc-sec-1',
          claimedFact: 'operating revenue of $128.4 million and net income of $45.2 million',
        },
      ],
    };

    const result = evaluator.evaluate(
      candidate,
      [candidate],
      sampleEvidence,
      strictEvidencePolicy,
    );

    expect(result.passed).toBe(true);
    expect(result.referenceResolution.resolvedCitations).toBe(1);
    expect(result.referenceResolution.phantomCitations.length).toBe(0);
    expect(result.sourceSupport.supportScore).toBeGreaterThanOrEqual(0.8);
    expect(result.sourceSupport.hasMissingEvidence).toBe(false);
  });

  it('CRITICAL: should NOT silently turn missing evidence into a passing score', () => {
    const candidate: CandidateResponse = {
      candidateId: 'cand-no-evidence',
      modelId: 'gpt-4o',
      output: 'Acme Corp had a record quarter.',
      latencyMs: 400,
      costUsd: 0.005,
      citations: [], // zero citations provided
    };

    // When policy requires evidence but candidate provides none (or evidence docs empty)
    const result = evaluator.evaluate(
      candidate,
      [candidate],
      [], // Empty evidence docs
      strictEvidencePolicy,
    );

    expect(result.passed).toBe(false);
    expect(result.sourceSupport.hasMissingEvidence).toBe(true);
    expect(result.sourceSupport.supportScore).toBe(0.0);
    expect(result.disqualificationReason).toContain('Missing ground truth evidence');
  });

  it('should detect and disqualify phantom citations', () => {
    const candidate: CandidateResponse = {
      candidateId: 'cand-phantom',
      modelId: 'mistral-large',
      output: 'Clinical trial proved efficacy in 99% of subjects [doc-phantom-999].',
      latencyMs: 300,
      costUsd: 0.003,
      citations: [
        {
          citationId: 'cit-phantom',
          sourceId: 'doc-phantom-999', // Does NOT exist in sampleEvidence
          claimedFact: 'Clinical trial proved efficacy',
        },
      ],
    };

    const result = evaluator.evaluate(
      candidate,
      [candidate],
      sampleEvidence,
      strictEvidencePolicy,
    );

    expect(result.passed).toBe(false);
    expect(result.referenceResolution.phantomCitations).toContain('doc-phantom-999');
    expect(result.disqualificationReason).toContain('Phantom citations detected');
  });

  it('should flag factual contradictions between candidate claims and source text', () => {
    const candidate: CandidateResponse = {
      candidateId: 'cand-contradict',
      modelId: 'llama-3',
      output: 'Acme Corp recorded operating revenue of $999.9 million in Q3.',
      latencyMs: 300,
      costUsd: 0.002,
      citations: [
        {
          citationId: 'cit-bad',
          sourceId: 'doc-sec-1',
          claimedFact: 'operating revenue of $999.9 million',
        },
      ],
    };

    const result = evaluator.evaluate(
      candidate,
      [candidate],
      sampleEvidence,
      strictEvidencePolicy,
    );

    expect(result.passed).toBe(false);
    expect(result.contradictionFlags.contradictsSource).toBe(true);
    expect(result.disqualificationReason).toContain('Contradiction detected');
  });
});
