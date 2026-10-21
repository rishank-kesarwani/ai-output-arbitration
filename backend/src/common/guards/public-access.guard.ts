import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class PublicAccessGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublicAccessEnabled = this.configService.get<boolean>(
      'publicAccessEnabled',
      true,
    );

    // If public demo access is enabled, permit anonymous access
    if (isPublicAccessEnabled) {
      return true;
    }

    // When public access is disabled, require explicit authentication via x-api-key or Bearer token
    const request = context.switchToHttp().getRequest<Request>();
    const apiKeyHeader = request.headers['x-api-key'] as string;
    const authHeader = request.headers.authorization;
    const configuredKey = this.configService.get<string>('serviceApiKey');

    if (configuredKey) {
      if (apiKeyHeader && apiKeyHeader === configuredKey) {
        return true;
      }

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token === configuredKey) {
          return true;
        }
      }
    }

    throw new UnauthorizedException(
      'Public demo access is disabled. Valid authentication credentials (x-api-key) are required.',
    );
  }
}
