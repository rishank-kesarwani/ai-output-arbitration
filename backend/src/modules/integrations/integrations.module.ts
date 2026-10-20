import { Module, Global } from '@nestjs/common';
import { AiPlatformClient } from './ai-platform.client';
import { NotificationServiceClient } from './notification.client';
import { ModelRegressionClient } from './model-regression.client';

@Global()
@Module({
  providers: [AiPlatformClient, NotificationServiceClient, ModelRegressionClient],
  exports: [AiPlatformClient, NotificationServiceClient, ModelRegressionClient],
})
export class IntegrationsModule {}
