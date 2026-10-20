import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  DecisionRecord,
  AggregateMetrics,
  ArbitrationOutcome,
} from '../../common/types';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly decisionRecords: Map<string, DecisionRecord> = new Map();

  /**
   * Generates cryptographic SHA-256 digest of core decision fields for audit immutability
   */
  generateSignatureHash(record: Omit<DecisionRecord, 'signatureHash'>): string {
    const payload = JSON.stringify({
      decisionId: record.decisionId,
      tenantId: record.tenantId,
      task: record.task,
      policyId: record.policyId,
      policyVersion: record.policyVersion,
      outcome: record.outcome,
      chosenCandidateId: record.chosenCandidateId || 'none',
      timestamp: record.timestamp,
      candidatesCount: record.candidates.length,
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Redacts sensitive terms (passwords, tokens, keys) from metadata
   */
  redactSensitiveData(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const sensitiveKeys = ['password', 'secret', 'apikey', 'authorization', 'token', 'jwt'];
    const copy = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key of Object.keys(copy)) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        copy[key] = '[REDACTED]';
      } else if (typeof copy[key] === 'object') {
        copy[key] = this.redactSensitiveData(copy[key]);
      }
    }
    return copy;
  }

  async recordDecision(
    recordData: Omit<DecisionRecord, 'signatureHash'>,
  ): Promise<DecisionRecord> {
    const sanitized = this.redactSensitiveData(recordData);
    const signatureHash = this.generateSignatureHash(sanitized);

    const fullRecord: DecisionRecord = {
      ...sanitized,
      signatureHash,
    };

    this.decisionRecords.set(fullRecord.decisionId, fullRecord);
    this.logger.log(
      `Recorded decision ${fullRecord.decisionId} [${fullRecord.outcome}] for tenant ${fullRecord.tenantId} (Sig: ${signatureHash.slice(0, 8)}...)`,
    );

    return fullRecord;
  }

  async getDecision(decisionId: string, tenantId = 'default-tenant'): Promise<DecisionRecord | null> {
    const record = this.decisionRecords.get(decisionId);
    if (!record) return null;
    if (record.tenantId !== tenantId && record.tenantId !== 'default-tenant') {
      return null; // Tenant isolation
    }
    return record;
  }

  async queryDecisions(
    tenantId: string,
    filter?: {
      outcome?: ArbitrationOutcome;
      policyId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ items: DecisionRecord[]; total: number }> {
    let all = Array.from(this.decisionRecords.values()).filter(
      (r) => r.tenantId === tenantId || tenantId === 'default-tenant',
    );

    if (filter?.outcome) {
      all = all.filter((r) => r.outcome === filter.outcome);
    }
    if (filter?.policyId) {
      all = all.filter((r) => r.policyId === filter.policyId);
    }

    // Sort newest first
    all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = all.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 20;

    return {
      items: all.slice(offset, offset + limit),
      total,
    };
  }

  async getMetrics(tenantId: string): Promise<AggregateMetrics> {
    const records = Array.from(this.decisionRecords.values()).filter(
      (r) => r.tenantId === tenantId || tenantId === 'default-tenant',
    );

    const totalEvaluations = records.length;
    let selectedCount = 0;
    let abstainedCount = 0;
    let rejectedCount = 0;
    let escalatedToReviewCount = 0;
    let totalLatency = 0;
    let totalCost = 0;
    let simulatedCount = 0;
    let realCount = 0;

    for (const r of records) {
      if (r.outcome === 'SELECTED') selectedCount++;
      else if (r.outcome === 'ABSTAINED') abstainedCount++;
      else if (r.outcome === 'REJECTED') rejectedCount++;
      else if (r.outcome === 'ESCALATED_TO_HUMAN_REVIEW') escalatedToReviewCount++;

      totalLatency += r.executionMetrics.totalLatencyMs || 0;
      totalCost += r.executionMetrics.totalCostUsd || 0;

      if (r.executionMetrics.isSimulated) {
        simulatedCount++;
      } else {
        realCount++;
      }
    }

    return {
      totalEvaluations,
      selectedCount,
      abstainedCount,
      rejectedCount,
      escalatedToReviewCount,
      averageLatencyMs:
        totalEvaluations > 0 ? Math.round(totalLatency / totalEvaluations) : 0,
      totalCostUsd: Math.round(totalCost * 10000) / 10000,
      simulatedEvaluationsCount: simulatedCount,
      realEvaluationsCount: realCount,
    };
  }
}
