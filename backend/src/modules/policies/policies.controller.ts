import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { TenantId } from '../../common/decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { ArbitrationPolicy } from '../../common/types';

@ApiTags('Policies')
@Controller('policies')
@UseGuards(TenantGuard)
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  @ApiOperation({ summary: 'List all arbitration policies for the current tenant' })
  @ApiResponse({ status: 200, description: 'List of policies' })
  async getPolicies(@TenantId() tenantId: string): Promise<ArbitrationPolicy[]> {
    return this.policiesService.findByTenant(tenantId);
  }

  @Get(':policyId')
  @ApiOperation({ summary: 'Get arbitration policy by ID' })
  @ApiResponse({ status: 200, description: 'Policy details' })
  async getPolicy(
    @Param('policyId') policyId: string,
    @TenantId() tenantId: string,
  ): Promise<ArbitrationPolicy> {
    return this.policiesService.getPolicy(policyId, tenantId);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'Admin/Editor API key required to mutate policies',
    required: false,
  })
  @ApiOperation({ summary: 'Create or update policy version (Admin/Editor authorized)' })
  @ApiResponse({ status: 200, description: 'Updated policy version' })
  async savePolicy(
    @TenantId() tenantId: string,
    @Body() body: Partial<ArbitrationPolicy> & { policyId: string; name: string },
  ): Promise<ArbitrationPolicy> {
    return this.policiesService.upsertPolicy(tenantId, body);
  }
}
