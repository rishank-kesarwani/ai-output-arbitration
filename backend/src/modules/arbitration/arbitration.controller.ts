import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ArbitrationService } from './arbitration.service';
import { EvaluateCandidatesDto } from './dto/arbitration.dto';
import { AuditService } from '../audit/audit.service';
import { ModelRegressionClient } from '../integrations/model-regression.client';
import { TenantId, WorkspaceId } from '../../common/decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { DecisionRecord, AggregateMetrics, ArbitrationOutcome } from '../../common/types';

@ApiTags('Arbitration')
@Controller('arbitration')
@UseGuards(TenantGuard)
export class ArbitrationController {
  constructor(
    private readonly arbitrationService: ArbitrationService,
    private readonly auditService: AuditService,
    private readonly regressionClient: ModelRegressionClient,
  ) {}

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Evaluate conflicting AI responses using deterministic checks, evidence grounding, and arbitration strategies',
    description:
      'Performs evidence-aware arbitration. Does not accept consensus as proof of truth. Silently missing evidence triggers calibrated abstention.',
  })
  @ApiResponse({
    status: 200,
    description: 'Auditable decision record with candidate breakdowns, checks performed, and chosen outcome',
  })
  async evaluate(
    @Body() dto: EvaluateCandidatesDto,
    @TenantId() tenantId: string,
    @WorkspaceId() workspaceId: string,
  ): Promise<DecisionRecord> {
    return this.arbitrationService.evaluateCandidates(dto, tenantId, workspaceId);
  }

  @Get('decisions')
  @ApiOperation({ summary: 'List auditable decision records with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of decision records' })
  async listDecisions(
    @TenantId() tenantId: string,
    @Query('outcome') outcome?: ArbitrationOutcome,
    @Query('policyId') policyId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditService.queryDecisions(tenantId, {
      outcome,
      policyId,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('decisions/:decisionId')
  @ApiOperation({ summary: 'Get decision record by ID with cryptographic signature' })
  @ApiResponse({ status: 200, description: 'Full decision record' })
  async getDecision(
    @Param('decisionId') decisionId: string,
    @TenantId() tenantId: string,
  ): Promise<DecisionRecord | null> {
    return this.auditService.getDecision(decisionId, tenantId);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get measured cost, latency, and arbitration outcome metrics' })
  @ApiResponse({ status: 200, description: 'Aggregate metrics' })
  async getMetrics(@TenantId() tenantId: string): Promise<AggregateMetrics> {
    return this.auditService.getMetrics(tenantId);
  }

  @Post('benchmark')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run benchmark comparison via Model Regression Detection service' })
  async runBenchmark(
    @Body() body: { candidateModels: string[]; arbitrationPolicyId?: string },
  ) {
    return this.regressionClient.runBenchmarkComparison({
      candidateModels: body.candidateModels || ['gpt-4o', 'gemini-1.5-pro', 'claude-3-5-sonnet'],
      arbitrationPolicyId: body.arbitrationPolicyId || 'strict-financial-v1',
    });
  }
}
