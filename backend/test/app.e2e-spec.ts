import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';

describe('AI Output Arbitration (e2e Routing, Exception, & Boundary Tests)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());

    app.setGlobalPrefix('api/v1', {
      exclude: [
        'health',
        'health/live',
        'health/ready',
        'api/v1/health',
        'api/v1/health/live',
        'api/v1/health/ready',
        '/',
      ],
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Root and Prefix Routing (Checklist D)', () => {
    it('GET / should return root discovery without prefix', async () => {
      const res = await request(app.getHttpServer()).get('/').expect(200);
      expect(res.body.service).toBe('ai-output-arbitration-backend');
      expect(res.body.status).toBe('operational');
      expect(res.body.publicAccessEnabled).toBe(true);
      expect(res.body.endpoints.health).toBe('/health');
    });

    it('GET /health should resolve without prefix', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);
      expect(res.body.status).toBe('UP');
    });

    it('GET /health/live should resolve liveness probe without prefix', async () => {
      const res = await request(app.getHttpServer()).get('/health/live').expect(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.check).toBe('liveness');
    });

    it('GET /health/ready should resolve readiness probe without prefix', async () => {
      const res = await request(app.getHttpServer()).get('/health/ready').expect(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.check).toBe('readiness');
      expect(res.body.memory).toBeDefined();
    });

    it('GET /api/v1/health should resolve with prefix', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
      expect(res.body.status).toBe('UP');
    });
  });

  describe('Exception Filter & Status Codes (Checklist C)', () => {
    it('should return 404 with sanitized error and correlation ID for unknown route', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/nonexistent-route-xyz')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(404);
      expect(res.body.correlationId).toBeDefined();
      expect(res.body.path).toBe('/api/v1/nonexistent-route-xyz');
    });

    it('should return 400 with sanitized validation details for missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/arbitration/evaluate')
        .send({
          // Missing 'task' and 'candidates'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(400);
      expect(res.body.correlationId).toBeDefined();
    });

    it('should enforce candidate count boundary <= 10 (reject > 10 candidates with 400)', async () => {
      const tooManyCandidates = Array.from({ length: 12 }, (_, i) => ({
        candidateId: `cand-${i}`,
        modelId: 'gpt-4o',
        output: `Output ${i}`,
        latencyMs: 100,
        costUsd: 0.001,
      }));

      const res = await request(app.getHttpServer())
        .post('/api/v1/arbitration/evaluate')
        .send({
          task: 'Boundary check',
          candidates: tooManyCandidates,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(400);
    });

    it('should block SSRF loopback addresses in evidence URIs', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/arbitration/evaluate')
        .send({
          task: 'SSRF check',
          candidates: [
            {
              candidateId: 'c1',
              modelId: 'm1',
              output: 'test',
              latencyMs: 100,
              costUsd: 0.001,
            },
          ],
          evidenceDocuments: [
            {
              sourceId: 's1',
              title: 'Evil Source',
              uri: 'http://127.0.0.1:8080/internal-secrets',
              content: 'test',
            },
          ],
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Disallowed evidence URI');
    });
  });

  describe('Arbitration Endpoints & Decision Integrity', () => {
    it('POST /api/v1/arbitration/evaluate should successfully execute evaluation and return decision with cryptographic signature', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/arbitration/evaluate')
        .set('x-tenant-id', 'test-tenant-e2e')
        .send({
          task: 'Calculate annual ROI',
          policyId: 'general-qa-v1',
          candidates: [
            {
              candidateId: 'cand-a',
              modelId: 'gpt-4o',
              output: 'Estimated annual ROI is 14.2% based on conservative market modeling.',
              latencyMs: 320,
              costUsd: 0.0025,
              confidenceScore: 0.93,
            },
            {
              candidateId: 'cand-b',
              modelId: 'gemini-1.5-pro',
              output: 'Estimated annual ROI is 13.9% with diversified portfolio allocation.',
              latencyMs: 290,
              costUsd: 0.0018,
              confidenceScore: 0.91,
            },
          ],
        })
        .expect(200);

      expect(res.body.decisionId).toBeDefined();
      expect(res.body.outcome).toBe('SELECTED');
      expect(res.body.signatureHash).toBeDefined();
      expect(res.body.signatureHash.length).toBe(64);
      expect(res.body.executionMetrics.totalLatencyMs).toBeGreaterThanOrEqual(0);
    });

    it('GET /api/v1/seed/scenarios should return reproducible test scenarios', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/seed/scenarios')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(4);
      expect(res.body[0].payload.candidates).toBeDefined();
    });

    it('GET /api/v1/arbitration/metrics should return aggregated metrics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/arbitration/metrics')
        .set('x-tenant-id', 'test-tenant-e2e')
        .expect(200);

      expect(res.body.totalEvaluations).toBeGreaterThanOrEqual(1);
      expect(res.body.selectedCount).toBeDefined();
      expect(res.body.averageLatencyMs).toBeDefined();
    });

    it('GET /api/v1/review-queue should return human review queue', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/review-queue')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Protected Mutation Authorization (ApiKeyGuard)', () => {
    let validApiKey: string;

    beforeAll(() => {
      const config = app.get(ConfigService);
      validApiKey = config.get<string>('serviceApiKey') || 'test-service-key';
    });

    it('POST /api/v1/policies should reject mutation without x-api-key with 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/policies')
        .send({
          policyId: 'unauthorized-policy',
          name: 'Unauthorized Policy Mutation',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid or missing x-api-key/i);
    });

    it('POST /api/v1/policies should reject mutation with invalid x-api-key with 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/policies')
        .set('x-api-key', 'wrong-key-value')
        .send({
          policyId: 'unauthorized-policy',
          name: 'Unauthorized Policy Mutation',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid or missing x-api-key/i);
    });

    it('POST /api/v1/policies should allow mutation with valid x-api-key', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/policies')
        .set('x-api-key', validApiKey)
        .send({
          policyId: 'general-qa-v1',
          name: 'General Q&A Truth Baseline',
          minConfidenceThreshold: 0.85,
        })
        .expect(200);

      expect(res.body.policyId).toBe('general-qa-v1');
    });

    it('POST /api/v1/review-queue/:id/resolve should reject adjudication without x-api-key with 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/review-queue/nonexistent-rev/resolve')
        .send({
          action: 'APPROVE',
          resolutionComment: 'Adjudication without auth',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid or missing x-api-key/i);
    });

    it('POST /api/v1/arbitration/benchmark should reject benchmark without x-api-key with 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/arbitration/benchmark')
        .send({
          candidateModels: ['gpt-4o', 'gemini-1.5-pro'],
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/arbitration/benchmark should allow benchmark with valid x-api-key', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/arbitration/benchmark')
        .set('x-api-key', validApiKey)
        .send({
          candidateModels: ['gpt-4o', 'gemini-1.5-pro'],
        })
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  describe('Independent Backend Public Access Enforcement (PUBLIC_ACCESS_ENABLED=false)', () => {
    let restrictedApp: INestApplication;
    let validApiKey: string;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      const config = moduleFixture.get(ConfigService);
      validApiKey = config.get<string>('serviceApiKey') || 'test-service-key';
      const originalGet = config.get.bind(config);
      jest.spyOn(config, 'get').mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'publicAccessEnabled') return false;
        if (key === 'serviceApiKey') return validApiKey;
        return originalGet(key, defaultValue);
      });

      restrictedApp = moduleFixture.createNestApplication();
      restrictedApp.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
          forbidNonWhitelisted: false,
          transformOptions: { enableImplicitConversion: true },
        }),
      );
      restrictedApp.useGlobalFilters(new AllExceptionsFilter());
      restrictedApp.useGlobalInterceptors(new LoggingInterceptor());
      restrictedApp.setGlobalPrefix('api/v1', {
        exclude: [
          'health',
          'health/live',
          'health/ready',
          'api/v1/health',
          'api/v1/health/live',
          'api/v1/health/ready',
          '/',
        ],
      });

      await restrictedApp.init();
    });

    afterAll(async () => {
      await restrictedApp.close();
    });

    it('GET / should report publicAccessEnabled: false in discovery payload', async () => {
      const res = await request(restrictedApp.getHttpServer()).get('/').expect(200);
      expect(res.body.publicAccessEnabled).toBe(false);
    });

    it('GET /health probe should remain accessible when public access is disabled', async () => {
      const res = await request(restrictedApp.getHttpServer()).get('/health').expect(200);
      expect(res.body.status).toBe('UP');
    });

    it('Direct anonymous POST /api/v1/arbitration/evaluate must be rejected with 401', async () => {
      const res = await request(restrictedApp.getHttpServer())
        .post('/api/v1/arbitration/evaluate')
        .send({
          task: 'Calculate annual ROI',
          candidates: [
            {
              candidateId: 'cand-a',
              modelId: 'gpt-4o',
              output: 'Estimated annual ROI is 14.2%',
              latencyMs: 300,
              costUsd: 0.002,
            },
          ],
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Public demo access is disabled/i);
    });

    it('Direct anonymous GET /api/v1/seed/scenarios must be rejected with 401', async () => {
      const res = await request(restrictedApp.getHttpServer())
        .get('/api/v1/seed/scenarios')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Public demo access is disabled/i);
    });

    it('Direct anonymous GET /api/v1/policies must be rejected with 401', async () => {
      const res = await request(restrictedApp.getHttpServer())
        .get('/api/v1/policies')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Public demo access is disabled/i);
    });

    it('Direct anonymous GET /api/v1/review-queue must be rejected with 401', async () => {
      const res = await request(restrictedApp.getHttpServer())
        .get('/api/v1/review-queue')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Public demo access is disabled/i);
    });

    it('Authenticated POST /api/v1/arbitration/evaluate with valid x-api-key should succeed even when public access is disabled', async () => {
      const res = await request(restrictedApp.getHttpServer())
        .post('/api/v1/arbitration/evaluate')
        .set('x-api-key', validApiKey)
        .set('x-tenant-id', 'test-tenant-e2e')
        .send({
          task: 'Calculate annual ROI',
          policyId: 'general-qa-v1',
          candidates: [
            {
              candidateId: 'cand-a',
              modelId: 'gpt-4o',
              output: 'Estimated annual ROI is 14.2% based on conservative market modeling.',
              latencyMs: 320,
              costUsd: 0.0025,
              confidenceScore: 0.93,
            },
          ],
        })
        .expect(200);

      expect(res.body.decisionId).toBeDefined();
      expect(res.body.outcome).toBe('SELECTED');
    });

    it('Authenticated GET /api/v1/seed/scenarios with valid x-api-key should succeed even when public access is disabled', async () => {
      const res = await request(restrictedApp.getHttpServer())
        .get('/api/v1/seed/scenarios')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
