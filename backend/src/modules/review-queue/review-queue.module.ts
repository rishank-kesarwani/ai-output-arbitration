import { Module } from '@nestjs/common';
import { ReviewQueueService } from './review-queue.service';
import { ReviewQueueController } from './review-queue.controller';

@Module({
  controllers: [ReviewQueueController],
  providers: [ReviewQueueService],
  exports: [ReviewQueueService],
})
export class ReviewQueueModule {}
