import { resolveApiUrl, isPublicAccessEnabled, ApiClient } from './api-client';

describe('Frontend API Client & URL Routing Strategy', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('resolveApiUrl (Direct-Backend URL Contract)', () => {
    it('should resolve standard local endpoint when base URL includes /api/v1', () => {
      const url = resolveApiUrl('arbitration/evaluate', 'http://localhost:4000/api/v1');
      expect(url).toBe('http://localhost:4000/api/v1/arbitration/evaluate');
    });

    it('should resolve standard local endpoint when base URL omits /api/v1', () => {
      const url = resolveApiUrl('arbitration/evaluate', 'http://localhost:4000');
      expect(url).toBe('http://localhost:4000/api/v1/arbitration/evaluate');
    });

    it('should strip trailing slashes from base URL', () => {
      const url = resolveApiUrl('arbitration/evaluate', 'http://localhost:4000/api/v1/');
      expect(url).toBe('http://localhost:4000/api/v1/arbitration/evaluate');
    });

    it('should strip leading slash from endpoint', () => {
      const url = resolveApiUrl('/seed/scenarios', 'http://localhost:4000/api/v1');
      expect(url).toBe('http://localhost:4000/api/v1/seed/scenarios');
    });

    it('should not duplicate /api/v1 if endpoint includes /api/v1 prefix', () => {
      const url = resolveApiUrl('/api/v1/seed/scenarios', 'http://localhost:4000/api/v1');
      expect(url).toBe('http://localhost:4000/api/v1/seed/scenarios');
    });

    it('should resolve production Render URL correctly', () => {
      const prodBase = 'https://ai-output-arbitration-backend.onrender.com/api/v1';
      const url = resolveApiUrl('policies', prodBase);
      expect(url).toBe('https://ai-output-arbitration-backend.onrender.com/api/v1/policies');
    });

    it('should append /api/v1 to production Render origin if omitted', () => {
      const prodOrigin = 'https://ai-output-arbitration-backend.onrender.com';
      const url = resolveApiUrl('policies', prodOrigin);
      expect(url).toBe('https://ai-output-arbitration-backend.onrender.com/api/v1/policies');
    });

    it('should resolve base root when endpoint is empty', () => {
      const url = resolveApiUrl('', 'http://localhost:4000/api/v1');
      expect(url).toBe('http://localhost:4000/api/v1');
    });

    it('should use process.env.NEXT_PUBLIC_API_URL when customBaseUrl is not provided', () => {
      process.env.NEXT_PUBLIC_API_URL = 'http://test-server:5000/api/v1';
      const url = resolveApiUrl('arbitration/metrics');
      expect(url).toBe('http://test-server:5000/api/v1/arbitration/metrics');
    });
  });

  describe('isPublicAccessEnabled (Frontend Access Flag)', () => {
    it('should return true by default when NEXT_PUBLIC_ACCESS_ENABLED is unset', () => {
      delete process.env.NEXT_PUBLIC_ACCESS_ENABLED;
      expect(isPublicAccessEnabled()).toBe(true);
    });

    it('should return true when NEXT_PUBLIC_ACCESS_ENABLED="true"', () => {
      process.env.NEXT_PUBLIC_ACCESS_ENABLED = 'true';
      expect(isPublicAccessEnabled()).toBe(true);
    });

    it('should return true when NEXT_PUBLIC_ACCESS_ENABLED="1"', () => {
      process.env.NEXT_PUBLIC_ACCESS_ENABLED = '1';
      expect(isPublicAccessEnabled()).toBe(true);
    });

    it('should return false when NEXT_PUBLIC_ACCESS_ENABLED="false"', () => {
      process.env.NEXT_PUBLIC_ACCESS_ENABLED = 'false';
      expect(isPublicAccessEnabled()).toBe(false);
    });

    it('should return false when NEXT_PUBLIC_ACCESS_ENABLED="0"', () => {
      process.env.NEXT_PUBLIC_ACCESS_ENABLED = '0';
      expect(isPublicAccessEnabled()).toBe(false);
    });

    it('should return false when NEXT_PUBLIC_ACCESS_ENABLED="off"', () => {
      process.env.NEXT_PUBLIC_ACCESS_ENABLED = 'off';
      expect(isPublicAccessEnabled()).toBe(false);
    });
  });

  describe('ApiClient Header Generation & Tenant Isolation', () => {
    let client: ApiClient;

    beforeEach(() => {
      client = new ApiClient();
    });

    it('should include default tenant and workspace headers', () => {
      const headers = client.getHeaders() as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['x-tenant-id']).toBe('default-tenant');
      expect(headers['x-workspace-id']).toBe('default-workspace');
      expect(headers['x-api-key']).toBeUndefined();
    });

    it('should allow custom tenant and workspace headers', () => {
      const headers = client.getHeaders({
        tenantId: 'tenant-enterprise-42',
        workspaceId: 'ws-finance',
      }) as Record<string, string>;

      expect(headers['x-tenant-id']).toBe('tenant-enterprise-42');
      expect(headers['x-workspace-id']).toBe('ws-finance');
    });

    it('should include x-api-key header when apiKey option is provided', () => {
      const headers = client.getHeaders({
        apiKey: 'test-admin-api-key-999',
      }) as Record<string, string>;

      expect(headers['x-api-key']).toBe('test-admin-api-key-999');
    });
  });
});
