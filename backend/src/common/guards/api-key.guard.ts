import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
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
      'Invalid or missing x-api-key authentication credential for protected operation.',
    );
  }
}
