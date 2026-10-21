import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReviewQueueService, ResolveReviewDto } from './review-queue.service';
import { TenantId } from '../../common/decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { PublicAccessGuard } from '../../common/guards/public-access.guard';
import { HumanReviewItem } from '../../common/types';

@ApiTags('Human Review Queue')
@Controller('review-queue')
@UseGuards(TenantGuard, PublicAccessGuard)
export class ReviewQueueController {
  constructor(private readonly reviewQueueService: ReviewQueueService) {}

  @Get()
  @ApiOperation({ summary: 'List review queue items' })
  @ApiResponse({ status: 200, description: 'List of review items' })
  async getQueue(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
  ): Promise<HumanReviewItem[]> {
    return this.reviewQueueService.getAll(tenantId, status);
  }

  @Get(':reviewId')
  @ApiOperation({ summary: 'Get specific review item' })
  @ApiResponse({ status: 200, description: 'Review item details' })
  async getReview(
    @Param('reviewId') reviewId: string,
    @TenantId() tenantId: string,
  ): Promise<HumanReviewItem> {
    return this.reviewQueueService.getById(reviewId, tenantId);
  }

  @Post(':reviewId/resolve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Resolve human review with approval, rejection or override' })
  @ApiResponse({ status: 200, description: 'Resolved review item' })
  async resolveReview(
    @Param('reviewId') reviewId: string,
    @TenantId() tenantId: string,
    @Body() body: ResolveReviewDto,
  ): Promise<HumanReviewItem> {
    return this.reviewQueueService.resolveReview(reviewId, body, tenantId);
  }
}
