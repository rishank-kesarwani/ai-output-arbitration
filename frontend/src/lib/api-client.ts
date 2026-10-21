import {
  DecisionRecord,
  ArbitrationPolicy,
  HumanReviewItem,
  AggregateMetrics,
} from './types';

/**
 * Resolves the full URL for a given API endpoint according to the direct-backend strategy.
 * Handles both baseUrl formats (with or without /api/v1, trailing slashes) and endpoint formats
 * (with or without leading slashes or /api/v1 prefix) without omitting or duplicating /api/v1.
 */
export function resolveApiUrl(endpoint: string = '', customBaseUrl?: string): string {
  const configuredUrl = customBaseUrl ?? process.env.NEXT_PUBLIC_API_URL;
  const trimmedBase =
    configuredUrl && configuredUrl.trim() !== ''
      ? configuredUrl.trim().replace(/\/+$/, '')
      : 'http://localhost:4000/api/v1';

  // Ensure base has the /api/v1 prefix without duplication
  const baseWithPrefix = trimmedBase.endsWith('/api/v1')
    ? trimmedBase
    : `${trimmedBase}/api/v1`;

  // Strip leading slashes and any duplicate /api/v1 from the endpoint
  let cleanEndpoint = endpoint.trim().replace(/^\/+/, '');
  if (cleanEndpoint.startsWith('api/v1/')) {
    cleanEndpoint = cleanEndpoint.slice('api/v1/'.length);
  }

  return cleanEndpoint ? `${baseWithPrefix}/${cleanEndpoint}` : baseWithPrefix;
}

/**
 * Checks if public/demo access is enabled on the frontend.
 * Reads NEXT_PUBLIC_ACCESS_ENABLED with strict boolean parsing.
 * Defaults to true for local development and demo environments if unset.
 */
export function isPublicAccessEnabled(): boolean {
  const val = process.env.NEXT_PUBLIC_ACCESS_ENABLED;
  if (val === undefined || val === null || val === '') {
    return true;
  }
  const normalized = val.trim().toLowerCase();
  return (
    normalized === 'true' ||
    normalized === '1' ||
    normalized === 'yes' ||
    normalized === 'on'
  );
}

export interface ApiClientOptions {
  tenantId?: string;
  workspaceId?: string;
  apiKey?: string;
}

export class ApiClient {
  private defaultTenantId = 'default-tenant';
  private defaultWorkspaceId = 'default-workspace';

  public isPublicAccessEnabled(): boolean {
    return isPublicAccessEnabled();
  }

  public getBaseUrl(): string {
    return resolveApiUrl('');
  }

  public getHeaders(customOptions?: ApiClientOptions): HeadersInit {
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
    const url = resolveApiUrl(endpoint);

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

        let message = errorData.message || `Request failed with status ${response.status}`;
        if (response.status === 401 && !customOptions?.apiKey) {
          message =
            errorData.message ||
            'Unauthorized: Public demo access is disabled or requires valid authentication credentials (x-api-key).';
        }

        const error = new Error(message);
        (error as any).status = response.status;
        (error as any).correlationId = errorData.correlationId;
        (error as any).errors = errorData.errors;
        throw error;
      }

      return await response.json();
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const baseUrl = this.getBaseUrl();
        const networkError = new Error(
          `Unable to connect to arbitration backend at ${baseUrl}. Verify backend service is running and accessible.`,
        );
        (networkError as any).status = 503;
        throw networkError;
      }
      throw err;
    }
  }

  // --- Arbitration Endpoints ---
  async evaluate(payload: any, options?: ApiClientOptions): Promise<DecisionRecord> {
    return this.request<DecisionRecord>(
      'arbitration/evaluate',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      options,
    );
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
    return this.request<DecisionRecord>(
      `arbitration/decisions/${decisionId}`,
      { method: 'GET' },
      options,
    );
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

  async savePolicy(
    policy: Partial<ArbitrationPolicy>,
    options?: ApiClientOptions,
  ): Promise<ArbitrationPolicy> {
    return this.request<ArbitrationPolicy>(
      'policies',
      {
        method: 'POST',
        body: JSON.stringify(policy),
      },
      options,
    );
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
    return this.request<HumanReviewItem>(
      `review-queue/${reviewId}/resolve`,
      {
        method: 'POST',
        body: JSON.stringify(action),
      },
      options,
    );
  }

  // --- Seed Scenarios ---
  async getScenarios(options?: ApiClientOptions): Promise<any[]> {
    return this.request<any[]>('seed/scenarios', { method: 'GET' }, options);
  }
}

export const apiClient = new ApiClient();
