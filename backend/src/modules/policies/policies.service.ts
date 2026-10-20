import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ArbitrationPolicy } from '../../common/types';

@Injectable()
export class PoliciesService {
  private readonly logger = new Logger(PoliciesService.name);
  private readonly policies: Map<string, ArbitrationPolicy> = new Map();

  constructor() {
    this.seedDefaultPolicies();
  }

  private seedDefaultPolicies() {
    const defaults: ArbitrationPolicy[] = [
      {
        policyId: 'strict-financial-v1',
        version: 1,
        tenantId: 'default-tenant',
        name: 'Strict Financial Reporting Policy',
        description:
          'Requires verified 10-K/10-Q citations, disallows phantom citations and factual contradictions, threshold 0.85.',
        strategy: 'HYBRID_SAFE',
        minConfidenceThreshold: 0.85,
        requireEvidence: true,
        disallowPhantomCitations: true,
        disallowContradictions: true,
        strictSchemaValidation: true,
        forbiddenKeywords: ['guaranteed returns', 'insider tip', 'risk-free profit'],
        weights: {
          schemaAndFormat: 0.2,
          evidenceSupport: 0.45,
          policyCompliance: 0.2,
          costEfficiency: 0.075,
          latencyEfficiency: 0.075,
        },
        updatedAt: new Date().toISOString(),
      },
      {
        policyId: 'medical-safety-v1',
        version: 1,
        tenantId: 'default-tenant',
        name: 'Clinical & Medical Safety Policy',
        description:
          'Zero tolerance for phantom clinical citations or contradiction with medical guidelines. Threshold 0.90.',
        strategy: 'HYBRID_SAFE',
        minConfidenceThreshold: 0.9,
        requireEvidence: true,
        disallowPhantomCitations: true,
        disallowContradictions: true,
        strictSchemaValidation: true,
        forbiddenKeywords: ['untested miracle cure', 'stop your chemotherapy', 'bypass doctor'],
        weights: {
          schemaAndFormat: 0.15,
          evidenceSupport: 0.5,
          policyCompliance: 0.25,
          costEfficiency: 0.05,
          latencyEfficiency: 0.05,
        },
        updatedAt: new Date().toISOString(),
      },
      {
        policyId: 'general-qa-v1',
        version: 1,
        tenantId: 'default-tenant',
        name: 'General Conversational QA Policy',
        description:
          'Balanced multi-factor scoring prioritizing low latency and cost efficiency with 0.70 confidence threshold.',
        strategy: 'WEIGHTED_SCORING',
        minConfidenceThreshold: 0.7,
        requireEvidence: false,
        disallowPhantomCitations: false,
        disallowContradictions: false,
        strictSchemaValidation: false,
        forbiddenKeywords: ['offensive-slur', 'hate-speech-example'],
        weights: {
          schemaAndFormat: 0.2,
          evidenceSupport: 0.2,
          policyCompliance: 0.2,
          costEfficiency: 0.2,
          latencyEfficiency: 0.2,
        },
        updatedAt: new Date().toISOString(),
      },
      {
        policyId: 'json-structured-v1',
        version: 1,
        tenantId: 'default-tenant',
        name: 'Strict JSON Structured Output Policy',
        description:
          'Strict JSON Schema compliance required. Disqualifies any malformed or non-compliant candidate.',
        strategy: 'DETERMINISTIC_RULES',
        minConfidenceThreshold: 0.75,
        requireEvidence: false,
        disallowPhantomCitations: false,
        disallowContradictions: false,
        strictSchemaValidation: true,
        forbiddenKeywords: [],
        weights: {
          schemaAndFormat: 0.5,
          evidenceSupport: 0.1,
          policyCompliance: 0.2,
          costEfficiency: 0.1,
          latencyEfficiency: 0.1,
        },
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const p of defaults) {
      this.policies.set(`${p.tenantId}:${p.policyId}`, p);
      // Also register without tenant prefix for global fallback
      this.policies.set(p.policyId, p);
    }
  }

  async findByTenant(tenantId: string): Promise<ArbitrationPolicy[]> {
    const list: ArbitrationPolicy[] = [];
    const seen = new Set<string>();

    for (const [key, policy] of this.policies.entries()) {
      if (policy.tenantId === tenantId || policy.tenantId === 'default-tenant') {
        if (!seen.has(policy.policyId)) {
          seen.add(policy.policyId);
          list.push(policy);
        }
      }
    }
    return list;
  }

  async getPolicy(policyId: string, tenantId = 'default-tenant'): Promise<ArbitrationPolicy> {
    const tenantKey = `${tenantId}:${policyId}`;
    if (this.policies.has(tenantKey)) {
      return this.policies.get(tenantKey)!;
    }
    if (this.policies.has(policyId)) {
      return this.policies.get(policyId)!;
    }
    throw new NotFoundException(`Arbitration policy "${policyId}" not found for tenant "${tenantId}".`);
  }

  async upsertPolicy(
    tenantId: string,
    dto: Partial<ArbitrationPolicy> & { policyId: string; name: string },
  ): Promise<ArbitrationPolicy> {
    const existing = this.policies.get(`${tenantId}:${dto.policyId}`) || this.policies.get(dto.policyId);
    const newVersion = existing ? existing.version + 1 : 1;

    const updated: ArbitrationPolicy = {
      policyId: dto.policyId,
      version: newVersion,
      tenantId,
      name: dto.name,
      description: dto.description || existing?.description || '',
      strategy: dto.strategy || existing?.strategy || 'HYBRID_SAFE',
      minConfidenceThreshold: dto.minConfidenceThreshold ?? existing?.minConfidenceThreshold ?? 0.7,
      requireEvidence: dto.requireEvidence ?? existing?.requireEvidence ?? false,
      disallowPhantomCitations: dto.disallowPhantomCitations ?? existing?.disallowPhantomCitations ?? true,
      disallowContradictions: dto.disallowContradictions ?? existing?.disallowContradictions ?? true,
      strictSchemaValidation: dto.strictSchemaValidation ?? existing?.strictSchemaValidation ?? true,
      forbiddenKeywords: dto.forbiddenKeywords || existing?.forbiddenKeywords || [],
      weights: dto.weights || existing?.weights || {
        schemaAndFormat: 0.25,
        evidenceSupport: 0.35,
        policyCompliance: 0.2,
        costEfficiency: 0.1,
        latencyEfficiency: 0.1,
      },
      updatedAt: new Date().toISOString(),
    };

    this.policies.set(`${tenantId}:${updated.policyId}`, updated);
    this.logger.log(`Policy ${updated.policyId} updated to version ${newVersion} for tenant ${tenantId}`);
    return updated;
  }
}
