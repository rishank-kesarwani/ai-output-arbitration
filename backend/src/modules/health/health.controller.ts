import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get(['health', 'api/v1/health'])
  @ApiOperation({ summary: 'General health check' })
  @ApiResponse({ status: 200, description: 'Service is operational' })
  getHealth(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      status: 'UP',
      service: 'ai-output-arbitration-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    });
  }

  @Get(['health/live', 'api/v1/health/live'])
  @ApiOperation({ summary: 'Kubernetes/Render liveness probe' })
  @ApiResponse({ status: 200, description: 'Liveness probe passed' })
  getLiveness(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      status: 'UP',
      check: 'liveness',
      timestamp: new Date().toISOString(),
    });
  }

  @Get(['health/ready', 'api/v1/health/ready'])
  @ApiOperation({ summary: 'Kubernetes/Render readiness probe' })
  @ApiResponse({ status: 200, description: 'Readiness probe passed' })
  getReadiness(@Res() res: Response) {
    // Check critical runtime dependencies
    const memoryUsage = process.memoryUsage();
    const heapUsedMb = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    const aiPlatformUrl = this.configService.get<string>('aiPlatform.url');
    const notificationServiceUrl = this.configService.get<string>('notificationService.url');

    return res.status(HttpStatus.OK).json({
      status: 'UP',
      check: 'readiness',
      memory: {
        heapUsedMb,
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      downstreamConfigured: {
        aiPlatform: Boolean(aiPlatformUrl),
        notificationService: Boolean(notificationServiceUrl),
      },
      timestamp: new Date().toISOString(),
    });
  }
}
