import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicAccessGuard } from './public-access.guard';

describe('PublicAccessGuard', () => {
  let guard: PublicAccessGuard;
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
    guard = new PublicAccessGuard(configService);
  });

  describe('When PUBLIC_ACCESS_ENABLED is true', () => {
    it('should permit anonymous requests without credentials', () => {
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'publicAccessEnabled') return true;
        return defaultValue;
      });

      const context = createMockContext();
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('When PUBLIC_ACCESS_ENABLED is false', () => {
    beforeEach(() => {
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'publicAccessEnabled') return false;
        if (key === 'serviceApiKey') return 'valid-secret-key-123';
        return defaultValue;
      });
    });

    it('should reject anonymous requests with UnauthorizedException', () => {
      const context = createMockContext({});
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        /Public demo access is disabled/i,
      );
    });

    it('should reject requests with invalid x-api-key header', () => {
      const context = createMockContext({ 'x-api-key': 'wrong-key' });
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should permit requests with valid x-api-key header', () => {
      const context = createMockContext({ 'x-api-key': 'valid-secret-key-123' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should permit requests with valid Bearer authorization header', () => {
      const context = createMockContext({
        authorization: 'Bearer valid-secret-key-123',
      });
      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
