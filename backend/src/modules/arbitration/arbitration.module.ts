import { Module } from '@nestjs/common';
import { ArbitrationService } from './arbitration.service';
import { ArbitrationController } from './arbitration.controller';
import { DeterministicEvaluator } from './evaluators/deterministic.evaluator';
import { EvidenceEvaluator } from './evaluators/evidence.evaluator';
import { DeterministicRulesStrategy } from './strategies/deterministic.strategy';
import { WeightedScoringStrategy } from './strategies/weighted.strategy';
import { JudgeModelStrategy } from './strategies/judge.strategy';
import { HybridSafeStrategy } from './strategies/hybrid.strategy';
import { PoliciesModule } from '../policies/policies.module';
import { ReviewQueueModule } from '../review-queue/review-queue.module';

@Module({
  imports: [PoliciesModule, ReviewQueueModule],
  controllers: [ArbitrationController],
  providers: [
    ArbitrationService,
    DeterministicEvaluator,
    EvidenceEvaluator,
    DeterministicRulesStrategy,
    WeightedScoringStrategy,
    JudgeModelStrategy,
    HybridSafeStrategy,
  ],
  exports: [ArbitrationService],
})
export class ArbitrationModule {}
