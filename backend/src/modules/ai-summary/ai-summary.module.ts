import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiSummary } from './entities/ai-summary.entity';
import { PromoData } from '../data-entry/entities/promo-data.entity';
import { DataEntryModule } from '../data-entry/data-entry.module';
import { MetricsCalculator } from '../report/metrics-calculator.service';
import { AiSummaryController } from './ai-summary.controller';
import { AiSummaryService } from './ai-summary.service';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { ModelConfigModule } from '../model-config/model-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiSummary, PromoData]),
    DataEntryModule,
    ModelConfigModule,
  ],
  controllers: [AiSummaryController],
  providers: [
    AiSummaryService,
    MetricsCalculator,
    DeepSeekProvider,
    OpenAIProvider,
  ],
})
export class AiSummaryModule {}
