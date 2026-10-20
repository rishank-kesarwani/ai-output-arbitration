import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      workspaceId?: string;
    }
  }
}

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const headerTenant = request.headers['x-tenant-id'] as string;
    const headerWorkspace = request.headers['x-workspace-id'] as string;

    // Validate tenantId if provided in header
    if (headerTenant) {
      if (!/^[a-zA-Z0-9_\-\.]{1,64}$/.test(headerTenant)) {
        throw new BadRequestException(
          'Invalid x-tenant-id header. Must be alphanumeric and under 64 characters.',
        );
      }
      request.tenantId = headerTenant;
    } else {
      request.tenantId = 'default-tenant';
    }

    if (headerWorkspace) {
      if (!/^[a-zA-Z0-9_\-\.]{1,64}$/.test(headerWorkspace)) {
        throw new BadRequestException(
          'Invalid x-workspace-id header. Must be alphanumeric and under 64 characters.',
        );
      }
      request.workspaceId = headerWorkspace;
    } else {
      request.workspaceId = 'default-workspace';
    }

    return true;
  }
}
