import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.tenantId || (request.headers['x-tenant-id'] as string) || 'default-tenant';
  },
);

export const WorkspaceId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.workspaceId || (request.headers['x-workspace-id'] as string) || 'default-workspace';
  },
);

export const CorrelationId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string) ||
      'unknown-correlation-id'
    );
  },
);
