import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let configService: jest.Mocked<ConfigService>;

  const createMockContext = (headers: Record<string, string> = {}): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;
    guard = new ApiKeyGuard(configService);
    configService.get.mockImplementation((key: string) => {
      if (key === 'serviceApiKey') return 'secure-test-api-key-123';
      return null;
    });
  });

  it('should reject anonymous requests with UnauthorizedException', () => {
    const context = createMockContext();
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow(/Invalid or missing x-api-key/i);
  });

  it('should reject requests with wrong x-api-key', () => {
    const context = createMockContext({ 'x-api-key': 'incorrect-key' });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should permit requests with matching x-api-key header', () => {
    const context = createMockContext({ 'x-api-key': 'secure-test-api-key-123' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should permit requests with matching Bearer token authorization header', () => {
    const context = createMockContext({
      authorization: 'Bearer secure-test-api-key-123',
    });
    expect(guard.canActivate(context)).toBe(true);
  });
});
