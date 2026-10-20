export interface LocalScenario {
  id: string;
  title: string;
  category: 'Financial' | 'Medical' | 'JSON Schema' | 'Missing Evidence' | 'Contradiction';
  description: string;
  payload: any;
}

export const DEFAULT_SCENARIOS: LocalScenario[] = [
  {
    id: 'financial-10k-conflict',
    title: 'Financial 10-K Conflict (Model A vs Model B)',
    category: 'Financial',
    description:
      'Two models report conflicting earnings figures. Only Model A matches the verified SEC 10-K filing excerpt; Model B asserts hallucinated numbers.',
    payload: {
      task: 'Extract Q3 GAAP Revenue and Consolidated Net Income for Acme Corp',
      policyId: 'strict-financial-v1',
      strategy: 'HYBRID_SAFE',
      isSimulated: true,
      evidenceDocuments: [
        {
          sourceId: 'doc-acme-10k-q3',
          title: 'Acme Corp SEC Form 10-K Quarterly Report Q3',
          uri: 'https://sec.gov/edgar/data/12345/acme-10k-q3.pdf',
          content:
            'Acme Corp reported consolidated operating GAAP revenue of $128.4 million and net income of $45.2 million for the third quarter ended September 30, 2024. Diluted EPS was $0.84.',
          version: '1.0',
          lastUpdated: '2024-10-18',
        },
      ],
      candidates: [
        {
          candidateId: 'cand-gemini-1',
          modelId: 'gemini-1.5-pro',
          output:
            'Acme Corp reported Q3 GAAP revenue of $128.4M and net income of $45.2M with diluted EPS of $0.84, reflecting strong enterprise subscription growth.',
          latencyMs: 380,
          costUsd: 0.0031,
          confidenceScore: 0.96,
          citations: [
            {
              citationId: 'cit-1',
              sourceId: 'doc-acme-10k-q3',
              claimedFact: 'GAAP revenue of $128.4 million and net income of $45.2 million',
            },
          ],
        },
        {
          candidateId: 'cand-gpt4o-1',
          modelId: 'gpt-4o',
          output:
            'Acme Corp delivered revenue of $142.1M and net income of $58.9M in Q3 2024, beating market consensus estimates.',
          latencyMs: 620,
          costUsd: 0.0075,
          confidenceScore: 0.91,
          citations: [
            {
              citationId: 'cit-2',
              sourceId: 'doc-acme-10k-q3',
              claimedFact: 'revenue of $142.1M and net income of $58.9M',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'medical-clinical-dosage',
    title: 'Clinical Dosage & Pediatric Safety (Phantom Citation Test)',
    category: 'Medical',
    description:
      'Model A adheres strictly to pediatric clinical safety guidelines. Model B invents a dosage schedule citing a non-existent trial (phantom citation).',
    payload: {
      task: 'Specify administration dosage for Drug-X in pediatric patients under 12 years',
      policyId: 'medical-safety-v1',
      strategy: 'HYBRID_SAFE',
      isSimulated: true,
      evidenceDocuments: [
        {
          sourceId: 'doc-pediatric-safety-2024',
          title: 'Pediatric Pharmacotherapy Guidelines 2024 - Section 12',
          uri: 'https://guidelines.nih.gov/pediatrics/drug-x-contraindication.pdf',
          content:
            'Drug-X is strictly contraindicated in pediatric patients under 12 years of age due to documented severe risk of irreversible cardiotoxicity and dysrhythmia.',
          version: '2024.1',
          lastUpdated: '2024-08-01',
        },
      ],
      candidates: [
        {
          candidateId: 'cand-claude-1',
          modelId: 'claude-3-5-sonnet',
          output:
            'Drug-X is strictly contraindicated in pediatric patients under 12 years of age due to documented risks of severe cardiotoxicity and dysrhythmia. Do not administer.',
          latencyMs: 440,
          costUsd: 0.0042,
          confidenceScore: 0.98,
          citations: [
            {
              citationId: 'cit-med-1',
              sourceId: 'doc-pediatric-safety-2024',
              claimedFact: 'strictly contraindicated in pediatric patients under 12 years of age',
            },
          ],
        },
        {
          candidateId: 'cand-mistral-1',
          modelId: 'mistral-large',
          output:
            'For children under 12, start with 15mg/kg oral suspension once daily, titrating up to 25mg/kg after 14 days.',
          latencyMs: 510,
          costUsd: 0.0038,
          confidenceScore: 0.88,
          citations: [
            {
              citationId: 'cit-phantom-1',
              sourceId: 'doc-pediatric-trial-phantom-99',
              claimedFact: '15mg/kg oral suspension once daily',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'json-schema-order-validation',
    title: 'JSON Schema Validation (Syntax & Type Constraints)',
    category: 'JSON Schema',
    description:
      'Validates deterministic compliance: Candidate 1 returns valid JSON Schema, Candidate 2 has broken syntax, and Candidate 3 misses required fields.',
    payload: {
      task: 'Parse and format customer purchase order into structured transaction schema',
      policyId: 'json-structured-v1',
      strategy: 'DETERMINISTIC_RULES',
      isSimulated: true,
      expectedSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          totalAmount: { type: 'number', minimum: 0 },
          currency: { type: 'string', enum: ['USD', 'EUR', 'GBP'] },
          items: { type: 'array', minItems: 1 },
        },
        required: ['orderId', 'totalAmount', 'currency', 'items'],
      },
      requiredFields: ['orderId', 'totalAmount', 'currency', 'items'],
      candidates: [
        {
          candidateId: 'cand-gpt4o-json',
          modelId: 'gpt-4o',
          output: JSON.stringify(
            {
              orderId: 'ORD-2026-904',
              totalAmount: 249.99,
              currency: 'USD',
              items: [{ id: 'ITEM-1', name: 'Security License Pro', qty: 1 }],
            },
            null,
            2,
          ),
          latencyMs: 310,
          costUsd: 0.0028,
          confidenceScore: 0.95,
        },
        {
          candidateId: 'cand-llama-broken',
          modelId: 'llama-3-70b',
          output:
            '{\n  "orderId": "ORD-2026-904",\n  "totalAmount": 249.99,\n  "currency": "USD",\n  "items": [ { "id": "ITEM-1", "name": "Security License Pro" \n// syntax error unclosed',
          latencyMs: 220,
          costUsd: 0.0015,
          confidenceScore: 0.72,
        },
        {
          candidateId: 'cand-mistral-missing-field',
          modelId: 'mistral-medium',
          output: JSON.stringify(
            {
              orderId: 'ORD-2026-904',
              totalAmount: 249.99,
              items: [{ id: 'ITEM-1', name: 'Security License Pro', qty: 1 }],
            },
            null,
            2,
          ),
          latencyMs: 280,
          costUsd: 0.0019,
          confidenceScore: 0.84,
        },
      ],
    },
  },
  {
    id: 'synthetic-consensus-missing-evidence',
    title: 'Calibrated Abstention (Unverified Consensus & Missing Evidence)',
    category: 'Missing Evidence',
    description:
      'Multiple models AGREE on a statement, but ground-truth evidence is missing. Demonstrates that consensus alone is NEVER proof of truth!',
    payload: {
      task: 'Verify ratification status of Inter-Regional Maritime Accord on Oct 14, 2024',
      policyId: 'strict-financial-v1',
      strategy: 'HYBRID_SAFE',
      isSimulated: true,
      evidenceDocuments: [],
      candidates: [
        {
          candidateId: 'cand-consensus-1',
          modelId: 'gpt-4o',
          output:
            'The Inter-Regional Maritime Accord was unanimously ratified on October 14, 2024 by all signatory nations.',
          latencyMs: 410,
          costUsd: 0.004,
          confidenceScore: 0.92,
        },
        {
          candidateId: 'cand-consensus-2',
          modelId: 'claude-3-5-sonnet',
          output:
            'On October 14, 2024, the Inter-Regional Maritime Accord received full ratification following parliamentary voting.',
          latencyMs: 430,
          costUsd: 0.0045,
          confidenceScore: 0.94,
        },
        {
          candidateId: 'cand-consensus-3',
          modelId: 'gemini-1.5-pro',
          output:
            'Signatory members confirmed the ratification of the Inter-Regional Maritime Accord on October 14, 2024.',
          latencyMs: 390,
          costUsd: 0.0035,
          confidenceScore: 0.91,
        },
      ],
    },
  },
  {
    id: 'contradictory-timestamp-claims',
    title: 'Factual Contradiction Detection & Escalation',
    category: 'Contradiction',
    description:
      'Models assert mutually contradictory timestamps for an industrial facility event. Triggers automatic human review escalation.',
    payload: {
      task: 'Determine the exact shutdown sequence trigger timestamp for Sector 7 Facility',
      policyId: 'strict-financial-v1',
      strategy: 'WEIGHTED_SCORING',
      isSimulated: true,
      evidenceDocuments: [
        {
          sourceId: 'doc-sector7-log',
          title: 'Sector 7 Operations Telemetry Log',
          content:
            'Primary reactor emergency cooling scram triggered automatically at 04:12:08 UTC following core pressure surge.',
          version: '1.0',
        },
      ],
      candidates: [
        {
          candidateId: 'cand-model-true',
          modelId: 'gemini-1.5-pro',
          output:
            'Sector 7 emergency cooling shutdown sequence triggered at 04:12:08 UTC following automatic core pressure detection.',
          latencyMs: 360,
          costUsd: 0.003,
          confidenceScore: 0.95,
          citations: [
            {
              citationId: 'cit-time-1',
              sourceId: 'doc-sector7-log',
              claimedFact: 'emergency cooling scram triggered automatically at 04:12:08 UTC',
            },
          ],
        },
        {
          candidateId: 'cand-model-contradicting',
          modelId: 'gpt-4o',
          output:
            'Sector 7 shutdown occurred at 06:45:00 UTC during scheduled shift transition.',
          latencyMs: 490,
          costUsd: 0.006,
          confidenceScore: 0.89,
          citations: [
            {
              citationId: 'cit-time-2',
              sourceId: 'doc-sector7-log',
              claimedFact: 'shutdown occurred at 06:45:00 UTC',
            },
          ],
        },
      ],
    },
  },
];
