import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('Root')
@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Service index and discovery' })
  @ApiResponse({ status: 200, description: 'Service operational summary' })
  getRoot() {
    return {
      service: 'ai-output-arbitration-backend',
      status: 'operational',
      version: '1.0.0',
      description: 'Evidence-aware AI response arbitration, deterministic validation, citation checking, and human review engine',
      publicAccessEnabled: this.configService.get<boolean>('publicAccessEnabled', true),
      endpoints: {
        docs: '/docs',
        health: '/health',
        liveness: '/health/live',
        readiness: '/health/ready',
        arbitration: '/api/v1/arbitration/evaluate',
        policies: '/api/v1/policies',
        reviewQueue: '/api/v1/review-queue',
        scenarios: '/api/v1/seed/scenarios',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
