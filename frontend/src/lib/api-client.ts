import {
  DecisionRecord,
  ArbitrationPolicy,
  HumanReviewItem,
  AggregateMetrics,
} from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiClientOptions {
  tenantId?: string;
  workspaceId?: string;
  apiKey?: string;
}

class ApiClient {
  private defaultTenantId = 'default-tenant';
  private defaultWorkspaceId = 'default-workspace';

  private getHeaders(customOptions?: ApiClientOptions): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-tenant-id': customOptions?.tenantId || this.defaultTenantId,
      'x-workspace-id': customOptions?.workspaceId || this.defaultWorkspaceId,
    };

    if (customOptions?.apiKey) {
      headers['x-api-key'] = customOptions.apiKey;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    customOptions?: ApiClientOptions,
  ): Promise<T> {
    // If endpoint starts with /, strip it
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${API_BASE_URL}/api/v1/${cleanEndpoint}`;

    const headers = {
      ...this.getHeaders(customOptions),
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        const error = new Error(
          errorData.message || `Request failed with status ${response.status}`,
        );
        (error as any).status = response.status;
        (error as any).correlationId = errorData.correlationId;
        (error as any).errors = errorData.errors;
        throw error;
      }

      return await response.json();
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const networkError = new Error(
          `Unable to connect to arbitration backend at ${API_BASE_URL}. Verify backend service is running.`,
        );
        (networkError as any).status = 503;
        throw networkError;
      }
      throw err;
    }
  }

  // --- Arbitration Endpoints ---
  async evaluate(payload: any, options?: ApiClientOptions): Promise<DecisionRecord> {
    return this.request<DecisionRecord>('arbitration/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, options);
  }

  async getDecisions(
    filter?: { outcome?: string; policyId?: string; limit?: number; offset?: number },
    options?: ApiClientOptions,
  ): Promise<{ items: DecisionRecord[]; total: number }> {
    const params = new URLSearchParams();
    if (filter?.outcome) params.set('outcome', filter.outcome);
    if (filter?.policyId) params.set('policyId', filter.policyId);
    if (filter?.limit) params.set('limit', String(filter.limit));
    if (filter?.offset) params.set('offset', String(filter.offset));

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ items: DecisionRecord[]; total: number }>(
      `arbitration/decisions${queryString}`,
      { method: 'GET' },
      options,
    );
  }

  async getDecision(decisionId: string, options?: ApiClientOptions): Promise<DecisionRecord> {
    return this.request<DecisionRecord>(`arbitration/decisions/${decisionId}`, { method: 'GET' }, options);
  }

  async getMetrics(options?: ApiClientOptions): Promise<AggregateMetrics> {
    return this.request<AggregateMetrics>('arbitration/metrics', { method: 'GET' }, options);
  }

  // --- Policies Endpoints ---
  async getPolicies(options?: ApiClientOptions): Promise<ArbitrationPolicy[]> {
    return this.request<ArbitrationPolicy[]>('policies', { method: 'GET' }, options);
  }

  async getPolicy(policyId: string, options?: ApiClientOptions): Promise<ArbitrationPolicy> {
    return this.request<ArbitrationPolicy>(`policies/${policyId}`, { method: 'GET' }, options);
  }

  async savePolicy(policy: Partial<ArbitrationPolicy>, options?: ApiClientOptions): Promise<ArbitrationPolicy> {
    return this.request<ArbitrationPolicy>('policies', {
      method: 'POST',
      body: JSON.stringify(policy),
    }, options);
  }

  // --- Human Review Queue Endpoints ---
  async getReviewQueue(status?: string, options?: ApiClientOptions): Promise<HumanReviewItem[]> {
    const queryString = status ? `?status=${status}` : '';
    return this.request<HumanReviewItem[]>(`review-queue${queryString}`, { method: 'GET' }, options);
  }

  async resolveReview(
    reviewId: string,
    action: {
      action: 'APPROVE' | 'REJECT' | 'OVERRIDE';
      candidateId?: string;
      resolutionComment: string;
      reviewerId?: string;
    },
    options?: ApiClientOptions,
  ): Promise<HumanReviewItem> {
    return this.request<HumanReviewItem>(`review-queue/${reviewId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(action),
    }, options);
  }

  // --- Seed Scenarios ---
  async getScenarios(options?: ApiClientOptions): Promise<any[]> {
    return this.request<any[]>('seed/scenarios', { method: 'GET' }, options);
  }
}

export const apiClient = new ApiClient();
