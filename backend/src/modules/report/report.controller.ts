import {
  Controller,
  Get,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportService } from './report.service';
import { OverviewDto } from './dto/overview.dto';
import { CrossAnalysisDto } from './dto/cross-analysis.dto';
import { ProductDetailDto } from './dto/product-detail.dto';
import { DailyDimensionDto } from './dto/daily-dimension.dto';
import { ProductSummaryDto } from './dto/product-summary.dto';
import { SummaryDimensionDto } from './dto/summary-dimension.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('reports')
@Roles('super_admin')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /** 概览仪表盘 */
  @Get('overview')
  getOverview(@Query() dto: OverviewDto) {
    return this.reportService.getOverview(dto);
  }

  /** 交叉分析 */
  @Get('cross-analysis')
  getCrossAnalysis(@Query() dto: CrossAnalysisDto) {
    return this.reportService.getCrossAnalysis(dto);
  }

  /** 产品明细 */
  @Get('product-detail')
  getProductDetail(@Query() dto: ProductDetailDto) {
    return this.reportService.getProductDetail(dto);
  }

  /** 产品汇总 */
  @Get('product-summary')
  getProductSummary(@Query() dto: ProductSummaryDto) {
    return this.reportService.getProductSummary(dto);
  }

  /** 渠道汇总 */
  @Get('channel-summary')
  getChannelSummary(@Query() dto: SummaryDimensionDto) {
    return this.reportService.getSummaryByDimension('channel', dto);
  }

  /** 按渠道日维度 */
  @Get('channel-daily')
  getChannelDaily(@Query() dto: DailyDimensionDto) {
    return this.reportService.getDailyByDimension('channel', dto);
  }

  /** 地区汇总 */
  @Get('region-summary')
  getRegionSummary(@Query() dto: SummaryDimensionDto) {
    return this.reportService.getSummaryByDimension('region', dto);
  }

  /** 按地区日维度 */
  @Get('region-daily')
  getRegionDaily(@Query() dto: DailyDimensionDto) {
    return this.reportService.getDailyByDimension('region', dto);
  }

  /** 站点汇总 */
  @Get('site-summary')
  getSiteSummary(@Query() dto: SummaryDimensionDto) {
    return this.reportService.getSummaryByDimension('site', dto);
  }

  /** 按站点日维度 */
  @Get('site-daily')
  getSiteDaily(@Query() dto: DailyDimensionDto) {
    return this.reportService.getDailyByDimension('site', dto);
  }

  /** Excel 导出 */
  @Get('export')
  async exportData(
    @Query() dto: CrossAnalysisDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.reportService.exportData(dto);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="report-export.xlsx"',
    });
    return new StreamableFile(buffer);
  }
}
