import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface EscalationAlertPayload {
  reviewId: string;
  tenantId: string;
  requestId: string;
  task: string;
  reason: string;
  reviewerEmail?: string;
}

@Injectable()
export class NotificationServiceClient {
  private readonly logger = new Logger(NotificationServiceClient.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('notificationService.url') ||
      'http://localhost:4002';
    this.apiKey =
      this.configService.get<string>('notificationService.apiKey') || '';
    this.timeoutMs =
      this.configService.get<number>('notificationService.timeoutMs') || 5000;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'x-api-key': this.apiKey } : {}),
      },
    });
  }

  /**
   * Dispatches human review escalation alert conforming to the confirmed Notification Service schema:
   * POST /v1/notifications
   */
  async sendReviewEscalationAlert(
    payload: EscalationAlertPayload,
  ): Promise<boolean> {
    const recipientEmail =
      payload.reviewerEmail || 'arbitration-reviewers@internal.corp';

    const requestBody = {
      priority: 'CRITICAL',
      channels: ['EMAIL'],
      recipient: {
        userId: `reviewer-${payload.tenantId}`,
        email: recipientEmail,
      },
      email: {
        subject: `[CRITICAL REVIEW] AI Output Escalation: ${payload.task} (${payload.reason})`,
        html: `
          <h2>AI Output Arbitration Escalation</h2>
          <p><strong>Review ID:</strong> ${payload.reviewId}</p>
          <p><strong>Tenant:</strong> ${payload.tenantId}</p>
          <p><strong>Request ID:</strong> ${payload.requestId}</p>
          <p><strong>Task:</strong> ${payload.task}</p>
          <p><strong>Escalation Trigger:</strong> ${payload.reason}</p>
          <p>Please log in to the Human Review Queue console to review candidate diffs and resolve.</p>
        `,
      },
      metadata: {
        reviewId: payload.reviewId,
        tenantId: payload.tenantId,
        source: 'ai-output-arbitration',
      },
    };

    try {
      this.logger.log(
        `Dispatching escalation alert to Notification Service at ${this.baseUrl}/v1/notifications`,
      );
      await this.client.post('/v1/notifications', requestBody);
      return true;
    } catch (err: any) {
      const status = err.response?.status;
      this.logger.warn(
        `Failed to deliver escalation alert via Notification Service (status: ${
          status || 'OFFLINE/TIMEOUT'
        }): ${err.message}. Degraded safely.`,
      );
      return false;
    }
  }
}
