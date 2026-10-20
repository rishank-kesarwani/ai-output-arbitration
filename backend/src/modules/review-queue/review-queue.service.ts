import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  HumanReviewItem,
  DecisionRecord,
  EscalationReason,
} from '../../common/types';
import { NotificationServiceClient } from '../integrations/notification.client';

export interface ResolveReviewDto {
  action: 'APPROVE' | 'REJECT' | 'OVERRIDE';
  candidateId?: string;
  resolutionComment: string;
  reviewerId?: string;
}

@Injectable()
export class ReviewQueueService {
  private readonly logger = new Logger(ReviewQueueService.name);
  private readonly queue: Map<string, HumanReviewItem> = new Map();

  constructor(private readonly notificationClient: NotificationServiceClient) {}

  async enqueueForReview(
    decisionRecord: DecisionRecord,
    escalationReason: EscalationReason,
    escalationDetails: string,
  ): Promise<HumanReviewItem> {
    const reviewId = `rev-${uuidv4()}`;

    const reviewItem: HumanReviewItem = {
      reviewId,
      decisionId: decisionRecord.decisionId,
      tenantId: decisionRecord.tenantId,
      workspaceId: decisionRecord.workspaceId,
      requestId: decisionRecord.requestId,
      task: decisionRecord.task,
      status: 'PENDING',
      escalationReason,
      escalationDetails,
      decisionRecord,
      createdAt: new Date().toISOString(),
    };

    this.queue.set(reviewId, reviewItem);
    this.logger.log(
      `Enqueued review ${reviewId} for decision ${decisionRecord.decisionId} (${escalationReason})`,
    );

    // Send notification alert safely via Notification Service integration
    await this.notificationClient.sendReviewEscalationAlert({
      reviewId,
      tenantId: decisionRecord.tenantId,
      requestId: decisionRecord.requestId,
      task: decisionRecord.task,
      reason: escalationReason,
    });

    return reviewItem;
  }

  async getPending(tenantId: string): Promise<HumanReviewItem[]> {
    return Array.from(this.queue.values())
      .filter((item) => (item.tenantId === tenantId || tenantId === 'default-tenant') && item.status === 'PENDING')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAll(tenantId: string, status?: string): Promise<HumanReviewItem[]> {
    return Array.from(this.queue.values())
      .filter((item) => {
        const matchesTenant = item.tenantId === tenantId || tenantId === 'default-tenant';
        const matchesStatus = !status || item.status === status;
        return matchesTenant && matchesStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getById(reviewId: string, tenantId = 'default-tenant'): Promise<HumanReviewItem> {
    const item = this.queue.get(reviewId);
    if (!item) {
      throw new NotFoundException(`Review item "${reviewId}" not found.`);
    }
    if (item.tenantId !== tenantId && tenantId !== 'default-tenant') {
      throw new NotFoundException(`Review item "${reviewId}" not found for tenant.`);
    }
    return item;
  }

  async resolveReview(
    reviewId: string,
    dto: ResolveReviewDto,
    tenantId = 'default-tenant',
  ): Promise<HumanReviewItem> {
    const item = await this.getById(reviewId, tenantId);

    if (item.status !== 'PENDING') {
      throw new BadRequestException(`Review item "${reviewId}" is already resolved (${item.status}).`);
    }

    if (!dto.resolutionComment || dto.resolutionComment.trim().length === 0) {
      throw new BadRequestException('A resolution commentary is strictly required for audit compliance.');
    }

    if (dto.action === 'OVERRIDE' && !dto.candidateId) {
      throw new BadRequestException('candidateId is required when overriding arbitration outcome.');
    }

    item.status = dto.action === 'APPROVE' ? 'APPROVED' : dto.action === 'REJECT' ? 'REJECTED' : 'OVERRIDDEN';
    item.reviewerId = dto.reviewerId || 'compliance-officer-1';
    item.resolutionComment = dto.resolutionComment;
    item.overriddenCandidateId = dto.candidateId;
    item.resolvedAt = new Date().toISOString();

    this.queue.set(reviewId, item);
    this.logger.log(`Review ${reviewId} resolved as ${item.status} by ${item.reviewerId}`);

    return item;
  }
}
