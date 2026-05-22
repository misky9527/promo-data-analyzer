import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoData } from '../data-entry/entities/promo-data.entity';
import { DataEntryModule } from '../data-entry/data-entry.module';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { MetricsCalculator } from './metrics-calculator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PromoData]),
    DataEntryModule,
  ],
  controllers: [ReportController],
  providers: [ReportService, MetricsCalculator],
})
export class ReportModule {}
