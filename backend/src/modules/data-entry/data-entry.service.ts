import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { PromoData } from './entities/promo-data.entity';
import { Channel } from '../dictionary/entities/channel.entity';
import { Product } from '../product/entities/product.entity';
import { Region } from '../dictionary/entities/region.entity';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { QueryEntryDto } from './dto/query-entry.dto';
import { ImportMode } from '../../common/constants/business.constants';

/** Excel 导入行数据（解析后） */
interface ExcelRow {
  date: string;
  channelCode: string;
  productAppId: string;
  regionCode: string;
  impressions: number;
  clicks: number;
  downloads: number;
  spend: number;
  revenue: number;
  chargeCount: number;
  registrations: number;
  retentionD1: number;
  retentionD7: number;
  retentionD30: number;
  remark: string;
}

/** Excel 列头映射 */
const COLUMN_HEADERS = {
  date: '日期',
  channelCode: '渠道编码',
  productAppId: '产品 AppID',
  regionCode: '地区编码',
  impressions: '展示量',
  clicks: '点击量',
  downloads: '下载量',
  spend: '消耗',
  revenue: '充值金额',
  chargeCount: '充值次数',
  registrations: '注册人数',
  retentionD1: '次留率',
  retentionD7: '7日留存率',
  retentionD30: '30日留存率',
  remark: '备注',
};

/** 模板列定义（按顺序） */
const TEMPLATE_COLUMNS: { key: keyof typeof COLUMN_HEADERS; width: number }[] = [
  { key: 'date', width: 14 },
  { key: 'channelCode', width: 14 },
  { key: 'productAppId', width: 18 },
  { key: 'regionCode', width: 14 },
  { key: 'impressions', width: 12 },
  { key: 'clicks', width: 12 },
  { key: 'downloads', width: 12 },
  { key: 'spend', width: 12 },
  { key: 'revenue', width: 12 },
  { key: 'chargeCount', width: 12 },
  { key: 'registrations', width: 14 },
  { key: 'retentionD1', width: 12 },
  { key: 'retentionD7', width: 14 },
  { key: 'retentionD30', width: 14 },
  { key: 'remark', width: 20 },
];

@Injectable()
export class DataEntryService {
  private readonly logger = new Logger(DataEntryService.name);

  constructor(
    @InjectRepository(PromoData)
    private readonly repo: Repository<PromoData>,
    @InjectRepository(Channel)
    private readonly channelRepo: Repository<Channel>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Region)
    private readonly regionRepo: Repository<Region>,
  ) {}

  // ═══════════════════════════════════════════════════════════
  // 逐条 CRUD
  // ═══════════════════════════════════════════════════════════

  /** 分页列表，JOIN 字典表返回 name */
  async list(query: QueryEntryDto) {
    const { page = 1, pageSize = 10 } = query;
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.channel', 'channel')
      .leftJoinAndSelect('p.app', 'app')
      .leftJoinAndSelect('p.region', 'region');

    if (query.startDate) {
      qb.andWhere('p.date >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('p.date <= :endDate', { endDate: query.endDate });
    }
    if (query.channelId) {
      qb.andWhere('p.channelId = :channelId', { channelId: query.channelId });
    }
    if (query.appId) {
      qb.andWhere('p.appId = :appId', { appId: query.appId });
    }
    if (query.regionId) {
      qb.andWhere('p.regionId = :regionId', { regionId: query.regionId });
    }
    if (query.keyword) {
      qb.andWhere(
        '(channel.name ILIKE :kw OR app.appName ILIKE :kw OR region.name ILIKE :kw OR p.remark ILIKE :kw)',
        { kw: `%${query.keyword}%` },
      );
    }

    qb.orderBy('p.date', 'DESC')
      .addOrderBy('p.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  /** 详情 */
  async findOne(id: number): Promise<PromoData> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['channel', 'app', 'region'],
    });
    if (!entity) throw new NotFoundException('数据记录不存在');
    return entity;
  }

  /** 逐条录入 */
  async create(dto: CreateEntryDto): Promise<PromoData> {
    // 校验 FK 存在性
    await this.validateFks(dto.channelId, dto.appId, dto.regionId);

    // 检查唯一性
    const existing = await this.repo.findOne({
      where: { date: dto.date, channelId: dto.channelId, appId: dto.appId, regionId: dto.regionId },
    });
    if (existing) {
      throw new ConflictException('相同日期、渠道、产品、地区的数据已存在');
    }

    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  /** 编辑 */
  async update(id: number, dto: UpdateEntryDto): Promise<PromoData> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('数据记录不存在');

    const date = dto.date ?? entity.date;
    const channelId = dto.channelId ?? entity.channelId;
    const appId = dto.appId ?? entity.appId;
    const regionId = dto.regionId ?? entity.regionId;

    if (dto.channelId || dto.appId || dto.regionId) {
      await this.validateFks(channelId, appId, regionId);
    }

    const conflict = await this.repo
      .createQueryBuilder('p')
      .where('p.id != :id', { id })
      .andWhere('p.date = :date', { date })
      .andWhere('p.channelId = :channelId', { channelId })
      .andWhere('p.appId = :appId', { appId })
      .andWhere('p.regionId = :regionId', { regionId })
      .getOne();
    if (conflict) {
      throw new ConflictException('相同日期、渠道、产品、地区的数据已存在');
    }

    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  /** 删除 */
  async remove(id: number): Promise<void> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('数据记录不存在');
    await this.repo.remove(entity);
  }

  // ═══════════════════════════════════════════════════════════
  // Excel 模板下载
  // ═══════════════════════════════════════════════════════════

  /** 生成 Excel 模板 Buffer */
  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('数据录入模板');

    const headerRow = sheet.getRow(1);
    TEMPLATE_COLUMNS.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = COLUMN_HEADERS[col.key];
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
      sheet.getColumn(i + 1).width = col.width;
    });

    // 示例数据行
    const exampleRow = sheet.getRow(2);
    exampleRow.getCell(1).value = '2025-01-01';
    exampleRow.getCell(2).value = 'baidu';
    exampleRow.getCell(3).value = '123456789';
    exampleRow.getCell(4).value = 'CN';
    exampleRow.getCell(5).value = 10000;
    exampleRow.getCell(6).value = 500;
    exampleRow.getCell(7).value = 200;
    exampleRow.getCell(8).value = 1500.5;
    exampleRow.getCell(9).value = 3000;
    exampleRow.getCell(10).value = 50;
    exampleRow.getCell(11).value = 45;
    exampleRow.getCell(12).value = 30;
    exampleRow.getCell(13).value = 15;
    exampleRow.getCell(14).value = 5;
    exampleRow.getCell(15).value = '备注示例';
    exampleRow.eachCell((cell) => {
      cell.alignment = { horizontal: 'center' };
    });

    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buf = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  // ═══════════════════════════════════════════════════════════
  // Excel 批量导入
  // ═══════════════════════════════════════════════════════════

  /** 导入 Excel 文件流，返回成功/失败统计 */
  async importExcel(
    buffer: Buffer,
    mode: ImportMode,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    const sheet = workbook.getWorksheet(1);
    if (!sheet) {
      throw new BadRequestException('Excel 文件中没有工作表');
    }

    const rows = await this.parseSheet(sheet);
    if (rows.length === 0) {
      throw new BadRequestException('Excel 文件中没有有效数据行');
    }

    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    // 批量解析 FK
    const codeMap = await this.resolveFkMap(rows);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 3;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
        errors.push(`第${rowNum}行：日期格式错误，应为 YYYY-MM-DD`);
        failedCount++;
        continue;
      }

      const channelId = codeMap.channel.get(row.channelCode);
      const appId = codeMap.app.get(row.productAppId);
      const regionId = codeMap.region.get(row.regionCode);

      if (!channelId) {
        errors.push(`第${rowNum}行：渠道编码 "${row.channelCode}" 不存在`);
        failedCount++;
        continue;
      }
      if (!appId) {
        errors.push(`第${rowNum}行：产品 AppID "${row.productAppId}" 不存在`);
        failedCount++;
        continue;
      }
      if (!regionId) {
        errors.push(`第${rowNum}行：地区编码 "${row.regionCode}" 不存在`);
        failedCount++;
        continue;
      }

      try {
        await this.upsertRow(row, channelId, appId, regionId, mode);
        successCount++;
      } catch (err: any) {
        errors.push(`第${rowNum}行：${err.message}`);
        failedCount++;
      }
    }

    this.logger.log(`导入完成: 成功 ${successCount}, 失败 ${failedCount}`);
    return { success: successCount, failed: failedCount, errors };
  }

  // ═══════════════════════════════════════════════════════════
  // 私有方法
  // ═══════════════════════════════════════════════════════════

  /** 校验三个外键对应的实体都存在 */
  private async validateFks(channelId: number, appId: number, regionId: number): Promise<void> {
    const [channel, product, region] = await Promise.all([
      this.channelRepo.findOne({ where: { id: channelId } }),
      this.productRepo.findOne({ where: { id: appId } }),
      this.regionRepo.findOne({ where: { id: regionId } }),
    ]);
    if (!channel) throw new BadRequestException(`渠道 ID ${channelId} 不存在`);
    if (!product) throw new BadRequestException(`产品 ID ${appId} 不存在`);
    if (!region) throw new BadRequestException(`地区 ID ${regionId} 不存在`);
  }

  /** 解析 Excel 工作表为行数据数组 */
  private async parseSheet(sheet: ExcelJS.Worksheet): Promise<ExcelRow[]> {
    const rows: ExcelRow[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;

      const values = row.values as any[];
      if (!values || values.every((v: any) => v === null || v === undefined || v === '')) {
        return;
      }

      const getVal = (colIdx: number): string =>
        row.getCell(colIdx).value?.toString()?.trim() ?? '';

      const getNum = (colIdx: number): number => {
        const v = row.getCell(colIdx).value;
        if (v === null || v === undefined || v === '') return 0;
        const n = Number(v);
        return isNaN(n) ? 0 : n;
      };

      rows.push({
        date: getVal(1),
        channelCode: getVal(2),
        productAppId: getVal(3),
        regionCode: getVal(4),
        impressions: getNum(5),
        clicks: getNum(6),
        downloads: getNum(7),
        spend: getNum(8),
        revenue: getNum(9),
        chargeCount: getNum(10),
        registrations: getNum(11),
        retentionD1: getNum(12),
        retentionD7: getNum(13),
        retentionD30: getNum(14),
        remark: getVal(15),
      });
    });
    return rows;
  }

  /** 根据 code 批量查找 FK id 映射 */
  private async resolveFkMap(rows: ExcelRow[]): Promise<{
    channel: Map<string, number>;
    app: Map<string, number>;
    region: Map<string, number>;
  }> {
    const channelCodes = [...new Set(rows.map((r) => r.channelCode).filter(Boolean))];
    const productAppIds = [...new Set(rows.map((r) => r.productAppId).filter(Boolean))];
    const regionCodes = [...new Set(rows.map((r) => r.regionCode).filter(Boolean))];

    const [channels, products, regions]: [Channel[], Product[], Region[]] = await Promise.all([
      channelCodes.length > 0
        ? this.channelRepo.find({ where: channelCodes.map((c) => ({ code: c })) })
        : ([] as Channel[]),
      productAppIds.length > 0
        ? this.productRepo.find({ where: productAppIds.map((p) => ({ appId: p })) })
        : ([] as Product[]),
      regionCodes.length > 0
        ? this.regionRepo.find({ where: regionCodes.map((c) => ({ code: c })) })
        : ([] as Region[]),
    ]);

    const channel = new Map<string, number>();
    channels.forEach((c) => channel.set(c.code, c.id));

    const app = new Map<string, number>();
    products.forEach((p) => app.set(p.appId, p.id));

    const region = new Map<string, number>();
    regions.forEach((r) => region.set(r.code, r.id));

    return { channel, app, region };
  }

  /** 单行 upsert */
  private async upsertRow(
    row: ExcelRow,
    channelId: number,
    appId: number,
    regionId: number,
    mode: ImportMode,
  ): Promise<void> {
    if (mode === ImportMode.APPEND) {
      await this.repo
        .createQueryBuilder()
        .insert()
        .into(PromoData)
        .values({
          date: row.date,
          channelId,
          appId,
          regionId,
          impressions: row.impressions,
          clicks: row.clicks,
          downloads: row.downloads,
          spend: row.spend,
          revenue: row.revenue,
          chargeCount: row.chargeCount,
          registrations: row.registrations,
          retentionD1: row.retentionD1,
          retentionD7: row.retentionD7,
          retentionD30: row.retentionD30,
          remark: row.remark || null,
        })
        .orIgnore()
        .execute();
    } else {
      await this.repo
        .createQueryBuilder()
        .insert()
        .into(PromoData)
        .values({
          date: row.date,
          channelId,
          appId,
          regionId,
          impressions: row.impressions,
          clicks: row.clicks,
          downloads: row.downloads,
          spend: row.spend,
          revenue: row.revenue,
          chargeCount: row.chargeCount,
          registrations: row.registrations,
          retentionD1: row.retentionD1,
          retentionD7: row.retentionD7,
          retentionD30: row.retentionD30,
          remark: row.remark || null,
        })
        .orUpdate(
          [
            'impressions',
            'clicks',
            'downloads',
            'spend',
            'revenue',
            'chargeCount',
            'registrations',
            'retentionD1',
            'retentionD7',
            'retentionD30',
            'remark',
          ],
          ['date', 'channel_id', 'app_id', 'region_id'],
        )
        .execute();
    }
  }
}
