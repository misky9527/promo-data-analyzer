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
import { RoleType } from '../../common/constants/business.constants';
import { RequiredPermission } from '../../common/decorators/required-permission.decorator';
import { PERMISSION_MENUS } from '../../common/constants/permission.constants';

@Controller('reports')
@Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
@RequiredPermission(PERMISSION_MENUS.reports.key)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('overview')
  @RequiredPermission(PERMISSION_MENUS.dashboard.key, PERMISSION_MENUS.reports.key)
  getOverview(@Query() dto: OverviewDto) {
    return this.reportService.getOverview(dto);
  }

  @Get('cross-analysis')
  getCrossAnalysis(@Query() dto: CrossAnalysisDto) {
    return this.reportService.getCrossAnalysis(dto);
  }

  @Get('product-detail')
  getProductDetail(@Query() dto: ProductDetailDto) {
    return this.reportService.getProductDetail(dto);
  }

  @Get('product-summary')
  getProductSummary(@Query() dto: ProductSummaryDto) {
    return this.reportService.getProductSummary(dto);
  }

  @Get('channel-summary')
  getChannelSummary(@Query() dto: SummaryDimensionDto) {
    return this.reportService.getSummaryByDimension('channel', dto);
  }

  @Get('channel-daily')
  getChannelDaily(@Query() dto: DailyDimensionDto) {
    return this.reportService.getDailyByDimension('channel', dto);
  }

  @Get('region-summary')
  getRegionSummary(@Query() dto: SummaryDimensionDto) {
    return this.reportService.getSummaryByDimension('region', dto);
  }

  @Get('region-daily')
  getRegionDaily(@Query() dto: DailyDimensionDto) {
    return this.reportService.getDailyByDimension('region', dto);
  }

  @Get('site-summary')
  getSiteSummary(@Query() dto: SummaryDimensionDto) {
    return this.reportService.getSummaryByDimension('site', dto);
  }

  @Get('site-daily')
  getSiteDaily(@Query() dto: DailyDimensionDto) {
    return this.reportService.getDailyByDimension('site', dto);
  }

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
