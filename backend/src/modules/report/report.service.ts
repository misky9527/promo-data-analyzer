import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { PromoData } from '../data-entry/entities/promo-data.entity';
import {
  MetricsCalculator,
  AggregatedRow,
  ComputedMetrics,
} from './metrics-calculator.service';
import { OverviewDto } from './dto/overview.dto';
import { CrossAnalysisDto } from './dto/cross-analysis.dto';
import { ProductDetailDto } from './dto/product-detail.dto';
import { DailyDimensionDto } from './dto/daily-dimension.dto';
import { ProductSummaryDto } from './dto/product-summary.dto';
import { SummaryDimensionDto } from './dto/summary-dimension.dto';

/** 渠道/App/地区中文名 */
interface DimensionLabel {
  id: number;
  name: string;
  code?: string;
}

/** 按日聚合行 */
interface DailyRow extends AggregatedRow {
  date: string;
}

/** 按月聚合行 */
interface MonthlyRow extends AggregatedRow {
  month: string;
}

interface ProductDetailRow extends AggregatedRow {
  date: string;
  chargeCount: number;
  channelId: number;
  channelName: string;
  regionId: number;
  regionName: string;
}

interface DailyDimensionRow extends AggregatedRow {
  date: string;
  dimensionId: number;
  dimensionName: string;
}

interface SummaryDimensionRow extends AggregatedRow {
  dimensionId: number;
  dimensionName: string;
}

interface ProductSummaryRow extends AggregatedRow {
  productId: number;
  appId: string;
  appName: string;
  storeIcon: string | null;
  platform: string | null;
  channelId: number;
  channelName: string;
  regionId: number;
  regionName: string;
  chargeCount: number;
}

/** 维度聚合行 */
interface DimensionRow extends AggregatedRow {
  dimension: string;
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectRepository(PromoData)
    private readonly repo: Repository<PromoData>,
    private readonly calc: MetricsCalculator,
  ) {}

  // ═══════════════════════════════════════
  // 概览仪表盘
  // ═══════════════════════════════════════

  async getOverview(dto: OverviewDto) {
    const { startDate, endDate, channelId, appId, regionId } = dto;

    // 汇总
    const summary = await this.aggregate({ startDate, endDate, channelId, appId, regionId });
    const summaryMetrics = summary ? this.calc.computeAll(summary) : null;

    // 按日分组
    const daily = await this.aggregateByDate({ startDate, endDate, channelId, appId, regionId });
    const dailyWithMetrics = daily.map((d) => ({
      date: d.date,
      ...this.calc.computeAll(d),
    }));

    // 按渠道分组（饼图）
    const byChannel = await this.aggregateByDimension(
      'channel',
      { startDate, endDate, channelId, appId, regionId },
    );
    const channelData = byChannel.map((r) => ({
      ...r,
      ...this.calc.computeAll(r),
    }));

    return {
      summary: summary
        ? {
            impressions: Number(summary.impressions),
            clicks: Number(summary.clicks),
            downloads: Number(summary.downloads),
            spend: Number(summary.spend),
            revenue: Number(summary.revenue),
            registrations: Number(summary.registrations),
            retentionD1: Number(summary.retentionD1),
            retentionD7: Number(summary.retentionD7),
            retentionD30: Number(summary.retentionD30),
            ...summaryMetrics,
          }
        : null,
      daily: dailyWithMetrics.map((d) => ({
        ...d,
        ...this.roundMetrics(d),
      })),
      byChannel: channelData.map((d) => ({
        ...d,
        ...this.roundMetrics(d),
      })),
    };
  }

  // ═══════════════════════════════════════
  // 交叉分析
  // ═══════════════════════════════════════

  async getCrossAnalysis(dto: CrossAnalysisDto) {
    const { startDate, endDate, rowDimension, colDimension, metrics, channelId, appId, regionId } =
      dto;

    const filters = { startDate, endDate, channelId, appId, regionId };

    if (!colDimension) {
      // 单维度分析：按 rowDimension GROUP BY
      const rows = await this.aggregateByDimension(rowDimension, filters);
      return {
        rows: rows.map((r) => ({
          dimension: r.dimension,
          ...this.calc.computeAll(r),
          ...this.roundMetrics(this.calc.computeAll(r)),
        })),
      };
    }

    // 二维交叉表：先 JOIN 维度表，再按 rowDimension x colDimension GROUP BY
    const dimJoinMap: Record<string, { alias: string; relation: string; entity: string }> = {
      channel: { alias: 'ch', relation: 'p.channel', entity: 'channel' },
      app: { alias: 'ap', relation: 'p.app', entity: 'product' },
      region: { alias: 'rg', relation: 'p.region', entity: 'region' },
    };

    const rowJoin = dimJoinMap[rowDimension];
    const colJoin = dimJoinMap[colDimension];

    // Product 表名称字段为 appName，其他字典表为 name
    const rowNameField = rowDimension === 'app' ? `${rowJoin.alias}.appName` : `${rowJoin.alias}.name`;
    const colNameField = colDimension === 'app' ? `${colJoin.alias}.appName` : `${colJoin.alias}.name`;

    // 同一维度做行列交叉时用不同别名
    const colAlias = rowDimension === colDimension ? colJoin.alias + '2' : colJoin.alias;
    const colRelation = rowDimension === colDimension
      ? `p.${colDimension}`
      : colJoin.relation;

    // 同名维度需要两次 JOIN 同一张表
    const qb = this.repo.createQueryBuilder('p')
      .leftJoin(rowJoin.relation, rowJoin.alias)
      .select(rowNameField, 'rowDim');

    if (rowDimension === colDimension) {
      qb.leftJoin(colRelation, colAlias)
        .addSelect(colNameField, 'colDim');
    } else {
      qb.leftJoin(colRelation, colAlias)
        .addSelect(colNameField, 'colDim');
    }

    const rawRows = qb
      .addSelect('SUM(p.impressions)', 'impressions')
      .addSelect('SUM(p.clicks)', 'clicks')
      .addSelect('SUM(p.downloads)', 'downloads')
      .addSelect('SUM(p.spend)', 'spend')
      .addSelect('SUM(p.revenue)', 'revenue')
      .addSelect('SUM(p.registrations)', 'registrations')
      .addSelect('SUM(p.paying_users)', 'payingUsers')
      .addSelect('SUM(p.retention_d1)', 'retentionD1')
      .addSelect('SUM(p.retention_d7)', 'retentionD7')
      .addSelect('SUM(p.retention_d30)', 'retentionD30')
      .where('p.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy(`${rowJoin.alias}.name`)
      .addGroupBy(`${colAlias}.name`)
      .orderBy(`${rowJoin.alias}.name`)
      .addOrderBy(`${colAlias}.name`);

    this.applyFilters(rawRows, filters);

    const raw = await rawRows.getRawMany();

    // 收集所有列维度值
    const colSet = new Set<string>();
    raw.forEach((r: any) => colSet.add(r.colDim));

    // 按行维度分组，构造 columns
    const columns = Array.from(colSet).sort();
    const rowMap = new Map<string, Record<string, any>>();
    raw.forEach((r: any) => {
      if (!rowMap.has(r.rowDim)) {
        rowMap.set(r.rowDim, { dimension: r.rowDim });
      }
      const obj = rowMap.get(r.rowDim)!;
      obj[`${r.colDim}_impressions`] = Number(r.impressions);
      obj[`${r.colDim}_clicks`] = Number(r.clicks);
      obj[`${r.colDim}_downloads`] = Number(r.downloads);
      obj[`${r.colDim}_spend`] = Number(r.spend);
      obj[`${r.colDim}_revenue`] = Number(r.revenue);

      // 计算该子格子的指标
      const subRow: AggregatedRow = {
        impressions: Number(r.impressions),
        clicks: Number(r.clicks),
        downloads: Number(r.downloads),
        spend: Number(r.spend),
        revenue: Number(r.revenue),
        registrations: Number(r.registrations),
        payingUsers: Number(r.payingUsers),
        retentionD1: Number(r.retentionD1),
        retentionD7: Number(r.retentionD7),
        retentionD30: Number(r.retentionD30),
      };
      const subMetrics = this.calc.computeAll(subRow);
      obj[`${r.colDim}_ctr`] = subMetrics.ctr;
      obj[`${r.colDim}_cvr`] = subMetrics.cvr;
      obj[`${r.colDim}_roas`] = subMetrics.roas;
    });

    return {
      rows: Array.from(rowMap.values()),
      columns: columns,
    };
  }

  async getSummaryByDimension(
    dimension: 'channel' | 'region',
    dto: SummaryDimensionDto,
  ) {
    const endDate = dto.endDate || new Date().toISOString().slice(0, 10);
    const startDate = dto.startDate || new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const rows = await this.aggregateSummaryByDimension(dimension, {
      startDate,
      endDate,
      channelId: dto.channelId,
      regionId: dto.regionId,
      appId: dto.productId,
    });

    return {
      rows: rows.map((row) => {
        const metrics = this.calc.computeAll(row);
        return {
          dimension: { id: row.dimensionId, name: row.dimensionName },
          impressions: row.impressions,
          clicks: row.clicks,
          downloads: row.downloads,
          spend: row.spend,
          revenue: row.revenue,
          registrations: row.registrations,
          payingUsers: row.payingUsers,
          retentionD1: row.retentionD1,
          retentionD7: row.retentionD7,
          retentionD30: row.retentionD30,
          ...this.roundMetrics(metrics),
        };
      }),
    };
  }

  async getDailyByDimension(
    dimension: 'channel' | 'region',
    dto: DailyDimensionDto,
  ) {
    const endDate = dto.endDate || new Date().toISOString().slice(0, 10);
    const startDate = dto.startDate || new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const rows = await this.aggregateDailyByDimension(dimension, {
      startDate,
      endDate,
      channelId: dto.channelId,
      regionId: dto.regionId,
      appId: dto.productId,
    });

    return {
      rows: rows.map((row) => {
        const metrics = this.calc.computeAll(row);
        // Format date as YYYY-MM-DD
        const d = new Date(row.date);
        const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        return {
          date: dateStr,
          [dimension]: { id: row.dimensionId, name: row.dimensionName },
          impressions: row.impressions,
          clicks: row.clicks,
          downloads: row.downloads,
          spend: row.spend,
          revenue: row.revenue,
          registrations: row.registrations,
          payingUsers: row.payingUsers,
          retentionD1: row.retentionD1,
          retentionD7: row.retentionD7,
          retentionD30: row.retentionD30,
          ...this.roundMetrics(metrics),
        };
      }),
    };
  }

  async getProductSummary(dto: ProductSummaryDto) {
    const endDate = dto.endDate || new Date().toISOString().slice(0, 10);
    const startDate = dto.startDate || new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const qb = this.repo
      .createQueryBuilder('p')
      .innerJoin('p.app', 'app')
      .innerJoin('p.channel', 'ch')
      .innerJoin('p.region', 'reg')
      .select('app.id', 'productId')
      .addSelect('app.app_id', 'appId')
      .addSelect('app.app_name', 'appName')
      .addSelect('app.store_icon', 'storeIcon')
      .addSelect('app.platform', 'platform')
      .addSelect('ch.id', 'channelId')
      .addSelect('ch.name', 'channelName')
      .addSelect('reg.id', 'regionId')
      .addSelect('reg.name', 'regionName')
      .addSelect('SUM(p.impressions)', 'impressions')
      .addSelect('SUM(p.clicks)', 'clicks')
      .addSelect('SUM(p.downloads)', 'downloads')
      .addSelect('SUM(p.spend)', 'spend')
      .addSelect('SUM(p.revenue)', 'revenue')
      .addSelect('SUM(p.charge_count)', 'chargeCount')
      .addSelect('SUM(p.registrations)', 'registrations')
      .addSelect('SUM(p.paying_users)', 'payingUsers')
      .addSelect('SUM(p.retention_d1)', 'retentionD1')
      .addSelect('SUM(p.retention_d7)', 'retentionD7')
      .addSelect('SUM(p.retention_d30)', 'retentionD30')
      .where('p.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('app.id')
      .addGroupBy('app.app_id')
      .addGroupBy('app.app_name')
      .addGroupBy('app.store_icon')
      .addGroupBy('app.platform')
      .addGroupBy('ch.id')
      .addGroupBy('ch.name')
      .addGroupBy('reg.id')
      .addGroupBy('reg.name')
      .orderBy('SUM(p.impressions)', 'DESC');

    this.applyFilters(qb, {
      channelId: dto.channelId,
      regionId: dto.regionId,
    });

    const raw = await qb.getRawMany();

    const rows = raw.map((row: any) => {
      const aggregated: ProductSummaryRow = {
        productId: Number(row.productId),
        appId: row.appId,
        appName: row.appName,
        storeIcon: row.storeIcon,
        platform: row.platform,
        channelId: Number(row.channelId),
        channelName: row.channelName,
        regionId: Number(row.regionId),
        regionName: row.regionName,
        chargeCount: Number(row.chargeCount),
        impressions: Number(row.impressions),
        clicks: Number(row.clicks),
        downloads: Number(row.downloads),
        spend: Number(row.spend),
        revenue: Number(row.revenue),
        registrations: Number(row.registrations),
        payingUsers: Number(row.payingUsers),
        retentionD1: Number(row.retentionD1),
        retentionD7: Number(row.retentionD7),
        retentionD30: Number(row.retentionD30),
      };
      const metrics = this.calc.computeAll(aggregated);

      return {
        product: {
          id: aggregated.productId,
          appId: aggregated.appId,
          appName: aggregated.appName,
          storeIcon: aggregated.storeIcon,
          platform: aggregated.platform,
        },
        channel: {
          id: aggregated.channelId,
          name: aggregated.channelName,
        },
        region: {
          id: aggregated.regionId,
          name: aggregated.regionName,
        },
        impressions: aggregated.impressions,
        clicks: aggregated.clicks,
        downloads: aggregated.downloads,
        spend: aggregated.spend,
        revenue: aggregated.revenue,
        chargeCount: aggregated.chargeCount,
        registrations: aggregated.registrations,
        payingUsers: aggregated.payingUsers,
        retentionD1: aggregated.retentionD1,
        retentionD7: aggregated.retentionD7,
        retentionD30: aggregated.retentionD30,
        ...this.roundMetrics(metrics),
      };
    });

    return { rows };
  }

  async getProductDetail(dto: ProductDetailDto) {
    const endDate = dto.endDate || new Date().toISOString().slice(0, 10);
    const startDate = dto.startDate || new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const product = await this.repo.manager
      .getRepository('product')
      .createQueryBuilder('app')
      .select('app.id', 'id')
      .addSelect('app.app_id', 'appId')
      .addSelect('app.app_name', 'appName')
      .addSelect('app.store_icon', 'storeIcon')
      .where('app.id = :productId', { productId: dto.productId })
      .getRawOne();

    if (!product) {
      return { product: null, rows: [] };
    }

    const qb = this.repo
      .createQueryBuilder('p')
      .innerJoin('p.channel', 'ch')
      .innerJoin('p.region', 'reg')
      .select('p.date', 'date')
      .addSelect('ch.id', 'channelId')
      .addSelect('ch.name', 'channelName')
      .addSelect('reg.id', 'regionId')
      .addSelect('reg.name', 'regionName')
      .addSelect('SUM(p.impressions)', 'impressions')
      .addSelect('SUM(p.clicks)', 'clicks')
      .addSelect('SUM(p.downloads)', 'downloads')
      .addSelect('SUM(p.spend)', 'spend')
      .addSelect('SUM(p.revenue)', 'revenue')
      .addSelect('SUM(p.charge_count)', 'chargeCount')
      .addSelect('SUM(p.registrations)', 'registrations')
      .addSelect('SUM(p.paying_users)', 'payingUsers')
      .addSelect('SUM(p.retention_d1)', 'retentionD1')
      .addSelect('SUM(p.retention_d7)', 'retentionD7')
      .addSelect('SUM(p.retention_d30)', 'retentionD30')
      .where('p.app_id = :productId', { productId: dto.productId })
      .andWhere('p.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('p.date')
      .addGroupBy('ch.id')
      .addGroupBy('ch.name')
      .addGroupBy('reg.id')
      .addGroupBy('reg.name')
      .orderBy('p.date', 'DESC')
      .addOrderBy('ch.name', 'ASC')
      .addOrderBy('reg.name', 'ASC');

    if (dto.channelId) qb.andWhere('p.channel_id = :channelId', { channelId: dto.channelId });
    if (dto.regionId) qb.andWhere('p.region_id = :regionId', { regionId: dto.regionId });

    const raw = await qb.getRawMany();
    const rows = raw.map((r: any) => {
      const base: ProductDetailRow = {
        date: r.date,
        channelId: Number(r.channelId),
        channelName: r.channelName,
        regionId: Number(r.regionId),
        regionName: r.regionName,
        impressions: Number(r.impressions),
        clicks: Number(r.clicks),
        downloads: Number(r.downloads),
        spend: Number(r.spend),
        revenue: Number(r.revenue),
        chargeCount: Number(r.chargeCount),
        registrations: Number(r.registrations),
        payingUsers: Number(r.payingUsers),
        retentionD1: Number(r.retentionD1),
        retentionD7: Number(r.retentionD7),
        retentionD30: Number(r.retentionD30),
      };
      const metrics = this.calc.computeAll(base);
      return {
        date: base.date,
        channel: { id: base.channelId, name: base.channelName },
        region: { id: base.regionId, name: base.regionName },
        impressions: base.impressions,
        clicks: base.clicks,
        downloads: base.downloads,
        spend: base.spend,
        revenue: base.revenue,
        registrations: base.registrations,
        payingUsers: base.payingUsers,
        chargeCount: base.chargeCount,
        retentionD1: base.retentionD1,
        retentionD7: base.retentionD7,
        retentionD30: base.retentionD30,
        ...this.roundMetrics(metrics),
      };
    });

    return {
      product: {
        id: Number(product.id),
        appId: product.appId,
        appName: product.appName,
        storeIcon: product.storeIcon,
      },
      rows,
    };
  }

  // ═══════════════════════════════════════
  // Excel 导出
  // ═══════════════════════════════════════

  async exportData(dto: CrossAnalysisDto): Promise<Buffer> {
    const data = await this.getCrossAnalysis(dto);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('交叉分析');

    if (!dto.colDimension || !data.columns || data.columns.length === 0) {
      // 单维度：简单列
      const headers = [
        dto.rowDimension,
        '展示量',
        '点击量',
        '下载量',
        '消耗',
        '充值金额',
        'CTR(%)',
        'CVR(%)',
        'ROAS(%)',
      ];
      const headerRow = sheet.addRow(headers);
      this.styleHeader(headerRow);

      (data.rows as any[]).forEach((row: any) => {
        sheet.addRow([
          row.dimension,
          row.impressions ?? 0,
          row.clicks ?? 0,
          row.downloads ?? 0,
          row.spend ?? 0,
          row.revenue ?? 0,
          row.ctr?.toFixed(2) ?? '0.00',
          row.cvr?.toFixed(2) ?? '0.00',
          row.roas?.toFixed(2) ?? '0.00',
        ]);
      });
    } else {
      // 二维交叉表
      const cols = data.columns! as any as string[];
      const headers: string[] = [dto.rowDimension];
      cols.forEach((c: string) => {
        headers.push(`${c}-展示量`, `${c}-点击量`, `${c}-下载量`, `${c}-CTR(%)`, `${c}-ROAS(%)`);
      });
      const headerRow = sheet.addRow(headers);
      this.styleHeader(headerRow);

      (data.rows as any[]).forEach((row: any) => {
        const vals = [row.dimension];
        cols.forEach((c) => {
          vals.push(
            row[`${c}_impressions`] ?? 0,
            row[`${c}_clicks`] ?? 0,
            row[`${c}_downloads`] ?? 0,
            row[`${c}_ctr`]?.toFixed(2) ?? '0.00',
            row[`${c}_roas`]?.toFixed(2) ?? '0.00',
          );
        });
        sheet.addRow(vals);
      });
    }

    // 冻结首行
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buf = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  // ═══════════════════════════════════════
  // 私有聚合方法
  // ═══════════════════════════════════════

  /** 聚合汇总 */
  private async aggregate(filters: {
    startDate: string;
    endDate: string;
    channelId?: number;
    appId?: number;
    regionId?: number;
  }): Promise<AggregatedRow | null> {
    const qb = this.repo
      .createQueryBuilder('p')
      .select('SUM(p.impressions)', 'impressions')
      .addSelect('SUM(p.clicks)', 'clicks')
      .addSelect('SUM(p.downloads)', 'downloads')
      .addSelect('SUM(p.spend)', 'spend')
      .addSelect('SUM(p.revenue)', 'revenue')
      .addSelect('SUM(p.registrations)', 'registrations')
      .addSelect('SUM(p.paying_users)', 'payingUsers')
      .addSelect('SUM(p.retention_d1)', 'retentionD1')
      .addSelect('SUM(p.retention_d7)', 'retentionD7')
      .addSelect('SUM(p.retention_d30)', 'retentionD30')
      .where('p.date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

    this.applyFilters(qb, filters);
    const raw = await qb.getRawOne();
    if (!raw || raw.impressions === null) return null;

    return {
      impressions: Number(raw.impressions),
      clicks: Number(raw.clicks),
      downloads: Number(raw.downloads),
      spend: Number(raw.spend),
      revenue: Number(raw.revenue),
      registrations: Number(raw.registrations),
      payingUsers: Number(raw.payingUsers),
      retentionD1: Number(raw.retentionD1),
      retentionD7: Number(raw.retentionD7),
      retentionD30: Number(raw.retentionD30),
    };
  }

  /** 按日聚合 */
  private async aggregateByDate(filters: {
    startDate: string;
    endDate: string;
    channelId?: number;
    appId?: number;
    regionId?: number;
  }): Promise<DailyRow[]> {
    const qb = this.repo
      .createQueryBuilder('p')
      .select('p.date', 'date')
      .addSelect('SUM(p.impressions)', 'impressions')
      .addSelect('SUM(p.clicks)', 'clicks')
      .addSelect('SUM(p.downloads)', 'downloads')
      .addSelect('SUM(p.spend)', 'spend')
      .addSelect('SUM(p.revenue)', 'revenue')
      .addSelect('SUM(p.registrations)', 'registrations')
      .addSelect('SUM(p.paying_users)', 'payingUsers')
      .addSelect('SUM(p.retention_d1)', 'retentionD1')
      .addSelect('SUM(p.retention_d7)', 'retentionD7')
      .addSelect('SUM(p.retention_d30)', 'retentionD30')
      .where('p.date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
      .groupBy('p.date')
      .orderBy('p.date', 'ASC');

    this.applyFilters(qb, filters);
    const raw = await qb.getRawMany();
    return raw.map((r: any) => ({
      date: r.date,
      impressions: Number(r.impressions),
      clicks: Number(r.clicks),
      downloads: Number(r.downloads),
      spend: Number(r.spend),
      revenue: Number(r.revenue),
      registrations: Number(r.registrations),
        payingUsers: Number(r.payingUsers),
      retentionD1: Number(r.retentionD1),
      retentionD7: Number(r.retentionD7),
      retentionD30: Number(r.retentionD30),
    }));
  }

  /** 维度汇总聚合 */
  private async aggregateSummaryByDimension(
    dimension: 'channel' | 'region',
    filters: {
      startDate: string;
      endDate: string;
      channelId?: number;
      appId?: number;
      regionId?: number;
    },
  ): Promise<SummaryDimensionRow[]> {
    const joinMap = {
      channel: { alias: 'ch', relation: 'p.channel', idField: 'ch.id', nameField: 'ch.name' },
      region: { alias: 'reg', relation: 'p.region', idField: 'reg.id', nameField: 'reg.name' },
    } as const;

    const jm = joinMap[dimension];

    const qb = this.repo
      .createQueryBuilder('p')
      .innerJoin(jm.relation, jm.alias)
      .select(jm.idField, 'dimensionId')
      .addSelect(jm.nameField, 'dimensionName')
      .addSelect('SUM(p.impressions)', 'impressions')
      .addSelect('SUM(p.clicks)', 'clicks')
      .addSelect('SUM(p.downloads)', 'downloads')
      .addSelect('SUM(p.spend)', 'spend')
      .addSelect('SUM(p.revenue)', 'revenue')
      .addSelect('SUM(p.registrations)', 'registrations')
      .addSelect('SUM(p.paying_users)', 'payingUsers')
      .addSelect('SUM(p.retention_d1)', 'retentionD1')
      .addSelect('SUM(p.retention_d7)', 'retentionD7')
      .addSelect('SUM(p.retention_d30)', 'retentionD30')
      .where('p.date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
      .groupBy(jm.idField)
      .addGroupBy(jm.nameField)
      .orderBy('impressions', 'DESC');

    this.applyFilters(qb, filters);
    const raw = await qb.getRawMany();

    return raw.map((r: any) => ({
      dimensionId: Number(r.dimensionId),
      dimensionName: r.dimensionName,
      impressions: Number(r.impressions),
      clicks: Number(r.clicks),
      downloads: Number(r.downloads),
      spend: Number(r.spend),
      revenue: Number(r.revenue),
      registrations: Number(r.registrations),
      payingUsers: Number(r.payingUsers),
      retentionD1: Number(r.retentionD1),
      retentionD7: Number(r.retentionD7),
      retentionD30: Number(r.retentionD30),
    }));
  }

  /** 按日 + 维度聚合 */
  private async aggregateDailyByDimension(
    dimension: 'channel' | 'region',
    filters: {
      startDate: string;
      endDate: string;
      channelId?: number;
      appId?: number;
      regionId?: number;
    },
  ): Promise<DailyDimensionRow[]> {
    const joinMap = {
      channel: { alias: 'ch', relation: 'p.channel', idField: 'ch.id', nameField: 'ch.name' },
      region: { alias: 'reg', relation: 'p.region', idField: 'reg.id', nameField: 'reg.name' },
    } as const;

    const jm = joinMap[dimension];

    const qb = this.repo
      .createQueryBuilder('p')
      .innerJoin(jm.relation, jm.alias)
      .select('p.date', 'date')
      .addSelect(jm.idField, 'dimensionId')
      .addSelect(jm.nameField, 'dimensionName')
      .addSelect('SUM(p.impressions)', 'impressions')
      .addSelect('SUM(p.clicks)', 'clicks')
      .addSelect('SUM(p.downloads)', 'downloads')
      .addSelect('SUM(p.spend)', 'spend')
      .addSelect('SUM(p.revenue)', 'revenue')
      .addSelect('SUM(p.registrations)', 'registrations')
      .addSelect('SUM(p.paying_users)', 'payingUsers')
      .addSelect('SUM(p.retention_d1)', 'retentionD1')
      .addSelect('SUM(p.retention_d7)', 'retentionD7')
      .addSelect('SUM(p.retention_d30)', 'retentionD30')
      .where('p.date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
      .groupBy('p.date')
      .addGroupBy(jm.idField)
      .addGroupBy(jm.nameField)
      .orderBy('p.date', 'DESC')
      .addOrderBy(jm.nameField, 'ASC');

    this.applyFilters(qb, filters);
    const raw = await qb.getRawMany();

    return raw.map((r: any) => ({
      date: r.date,
      dimensionId: Number(r.dimensionId),
      dimensionName: r.dimensionName,
      impressions: Number(r.impressions),
      clicks: Number(r.clicks),
      downloads: Number(r.downloads),
      spend: Number(r.spend),
      revenue: Number(r.revenue),
      registrations: Number(r.registrations),
      payingUsers: Number(r.payingUsers),
      retentionD1: Number(r.retentionD1),
      retentionD7: Number(r.retentionD7),
      retentionD30: Number(r.retentionD30),
    }));
  }

  /** 按维度聚合（JOIN 字典表取 name） */
  private async aggregateByDimension(
    dimension: string,
    filters: {
      startDate: string;
      endDate: string;
      channelId?: number;
      appId?: number;
      regionId?: number;
    },
  ): Promise<DimensionRow[]> {
    // 确定 join 表和 select 字段
    const joinMap: Record<string, { alias: string; relation: string; entity: string }> = {
      channel: { alias: 'ch', relation: 'p.channel', entity: 'channel' },
      app: { alias: 'app', relation: 'p.app', entity: 'product' },
      region: { alias: 'reg', relation: 'p.region', entity: 'region' },
    };

    const jm = joinMap[dimension];
    if (!jm) throw new Error(`Unknown dimension: ${dimension}`);

    // Product 表名称字段为 appName，其他字典表为 name
    const nameField = dimension === 'app' ? `${jm.alias}.appName` : `${jm.alias}.name`;

    const qb = this.repo
      .createQueryBuilder('p')
      .innerJoin(jm.relation, jm.alias)
      .select(nameField, 'dimension')
      .addSelect('SUM(p.impressions)', 'impressions')
      .addSelect('SUM(p.clicks)', 'clicks')
      .addSelect('SUM(p.downloads)', 'downloads')
      .addSelect('SUM(p.spend)', 'spend')
      .addSelect('SUM(p.revenue)', 'revenue')
      .addSelect('SUM(p.registrations)', 'registrations')
      .addSelect('SUM(p.paying_users)', 'payingUsers')
      .addSelect('SUM(p.retention_d1)', 'retentionD1')
      .addSelect('SUM(p.retention_d7)', 'retentionD7')
      .addSelect('SUM(p.retention_d30)', 'retentionD30')
      .where('p.date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
      .groupBy(`${jm.alias}.id`)
      .addGroupBy(`${jm.alias}.name`)
      .orderBy('impressions', 'DESC');

    this.applyFilters(qb, filters);
    const raw = await qb.getRawMany();

    return raw.map((r: any) => ({
      dimension: r.dimension,
      impressions: Number(r.impressions),
      clicks: Number(r.clicks),
      downloads: Number(r.downloads),
      spend: Number(r.spend),
      revenue: Number(r.revenue),
      registrations: Number(r.registrations),
        payingUsers: Number(r.payingUsers),
      retentionD1: Number(r.retentionD1),
      retentionD7: Number(r.retentionD7),
      retentionD30: Number(r.retentionD30),
    }));
  }

  /** 应用通用筛选 */
  private applyFilters(qb: any, filters: {
    channelId?: number;
    appId?: number;
    regionId?: number;
  }): void {
    if (filters.channelId) qb.andWhere('p.channel_id = :channelId', { channelId: filters.channelId });
    if (filters.appId) qb.andWhere('p.app_id = :appId', { appId: filters.appId });
    if (filters.regionId) qb.andWhere('p.region_id = :regionId', { regionId: filters.regionId });
  }

  /** 对指标结果四舍五入到 2 位小数 */
  private roundMetrics(m: ComputedMetrics): Partial<ComputedMetrics> {
    return {
      ctr: +m.ctr.toFixed(2),
      cvr: +m.cvr.toFixed(2),
      cpi: +m.cpi.toFixed(2),
      cpm: +m.cpm.toFixed(2),
      cpc: +m.cpc.toFixed(2),
      roas: +m.roas.toFixed(2),
      payRate: +m.payRate.toFixed(2),
      registrationRate: +m.registrationRate.toFixed(2),
      costPerRegistration: +m.costPerRegistration.toFixed(2),
      costPerPayingUser: +m.costPerPayingUser.toFixed(2),
      retentionD1Rate: +m.retentionD1Rate.toFixed(2),
      retentionD7Rate: +m.retentionD7Rate.toFixed(2),
      retentionD30Rate: +m.retentionD30Rate.toFixed(2),
      ltv: +m.ltv.toFixed(2),
    };
  }

  /** 样式化表头 */
  private styleHeader(row: ExcelJS.Row): void {
    row.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD6E4F0' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  }
}
