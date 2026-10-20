import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';

import { AppController } from './app.controller';
import { HealthModule } from './modules/health/health.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AuditModule } from './modules/audit/audit.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { ReviewQueueModule } from './modules/review-queue/review-queue.module';
import { ArbitrationModule } from './modules/arbitration/arbitration.module';
import { SeedModule } from './modules/seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '../.env'],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('throttle.ttl', 60) * 1000,
          limit: configService.get<number>('throttle.limit', 100),
        },
      ],
      inject: [ConfigService],
    }),
    HealthModule,
    IntegrationsModule,
    AuditModule,
    PoliciesModule,
    ReviewQueueModule,
    ArbitrationModule,
    SeedModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
