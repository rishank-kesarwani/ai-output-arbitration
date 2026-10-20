import { DeterministicEvaluator } from './deterministic.evaluator';
import { ArbitrationPolicy, CandidateResponse } from '../../../common/types';

describe('DeterministicEvaluator', () => {
  let evaluator: DeterministicEvaluator;

  const samplePolicy: ArbitrationPolicy = {
    policyId: 'test-policy',
    version: 1,
    tenantId: 'test-tenant',
    name: 'Test Policy',
    description: 'Testing',
    strategy: 'DETERMINISTIC_RULES',
    minConfidenceThreshold: 0.7,
    requireEvidence: false,
    disallowPhantomCitations: true,
    disallowContradictions: true,
    strictSchemaValidation: true,
    forbiddenKeywords: ['forbidden_keyword', 'malicious_token'],
    weights: {
      schemaAndFormat: 0.3,
      evidenceSupport: 0.3,
      policyCompliance: 0.2,
      costEfficiency: 0.1,
      latencyEfficiency: 0.1,
    },
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    evaluator = new DeterministicEvaluator();
  });

  it('should pass a valid candidate meeting schema and required fields', () => {
    const candidate: CandidateResponse = {
      candidateId: 'cand-1',
      modelId: 'test-model',
      output: JSON.stringify({ keyA: 'valueA', score: 95 }),
      latencyMs: 120,
      costUsd: 0.001,
    };

    const schema = {
      type: 'object',
      properties: {
        keyA: { type: 'string' },
        score: { type: 'number', minimum: 0 },
      },
      required: ['keyA', 'score'],
    };

    const result = evaluator.evaluate(
      candidate,
      samplePolicy,
      schema,
      ['keyA', 'score'],
      undefined,
    );

    expect(result.passed).toBe(true);
    expect(result.requiredFieldsCheck.passed).toBe(true);
    expect(result.jsonSchemaCheck.passed).toBe(true);
    expect(result.policyCheck.passed).toBe(true);
    expect(result.disqualificationReason).toBeUndefined();
  });

  it('should disqualify candidate with missing required fields', () => {
    const candidate: CandidateResponse = {
      candidateId: 'cand-missing',
      modelId: 'test-model',
      output: JSON.stringify({ keyA: 'valueA' }), // missing 'score'
      latencyMs: 150,
      costUsd: 0.001,
    };

    const result = evaluator.evaluate(
      candidate,
      samplePolicy,
      undefined,
      ['keyA', 'score'],
      undefined,
    );

    expect(result.passed).toBe(false);
    expect(result.requiredFieldsCheck.missingFields).toContain('score');
    expect(result.disqualificationReason).toContain('Missing required fields: score');
  });

  it('should disqualify candidate with malformed JSON when schema is expected', () => {
    const candidate: CandidateResponse = {
      candidateId: 'cand-bad-json',
      modelId: 'test-model',
      output: '{ keyA: unquoted broken json...',
      latencyMs: 150,
      costUsd: 0.001,
    };

    const schema = {
      type: 'object',
      properties: { keyA: { type: 'string' } },
      required: ['keyA'],
    };

    const result = evaluator.evaluate(
      candidate,
      samplePolicy,
      schema,
      ['keyA'],
      undefined,
    );

    expect(result.passed).toBe(false);
    expect(result.jsonSchemaCheck.passed).toBe(false);
    expect(result.disqualificationReason).toContain('JSON schema validation failed');
  });

  it('should disqualify candidate containing forbidden policy terms', () => {
    const candidate: CandidateResponse = {
      candidateId: 'cand-forbidden',
      modelId: 'test-model',
      output: 'This answer mentions a forbidden_keyword in the text.',
      latencyMs: 100,
      costUsd: 0.001,
    };

    const result = evaluator.evaluate(
      candidate,
      samplePolicy,
      undefined,
      undefined,
      undefined,
    );

    expect(result.passed).toBe(false);
    expect(result.policyCheck.passed).toBe(false);
    expect(result.policyCheck.forbiddenTermsFound).toContain('forbidden_keyword');
  });
});
