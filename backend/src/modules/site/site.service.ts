import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Site } from './entities/site.entity';
import { SiteDailyData } from './entities/site-daily-data.entity';
import { Product } from '../product/entities/product.entity';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { QuerySiteDto } from './dto/query-site.dto';
import { CreateDailyDataDto } from './dto/create-daily-data.dto';
import { QueryDailyDataDto } from './dto/query-daily-data.dto';

const DAILY_COLUMNS = [
  { key: 'date', label: '日期', width: 14 },
  { key: 'registrations', label: '注册人数', width: 12 },
  { key: 'payingUsers', label: '充值人数', width: 12 },
  { key: 'firstChargeUsers', label: '首冲人数', width: 12 },
  { key: 'entertainmentRevenue', label: '娱乐流水', width: 12 },
  { key: 'entertainmentUsers', label: '娱乐人数', width: 12 },
  { key: 'rechargeGold', label: '充值金币', width: 12 },
  { key: 'exchangeAmount', label: '兑换金额', width: 12 },
  { key: 'exchangeUsers', label: '兑换人数', width: 12 },
  { key: 'retentionD1', label: '次留人数', width: 12 },
  { key: 'retentionD7', label: '7留人数', width: 12 },
  { key: 'retentionD30', label: '30留人数', width: 12 },
];

@Injectable()
export class SiteService {
  private readonly logger = new Logger(SiteService.name);

  constructor(
    @InjectRepository(Site) private readonly siteRepo: Repository<Site>,
    @InjectRepository(SiteDailyData) private readonly dailyRepo: Repository<SiteDailyData>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) {}

  async list(query: QuerySiteDto) {
    const { page = 1, pageSize = 10, keyword } = query;
    const qb = this.siteRepo.createQueryBuilder('s')
      .loadRelationCountAndMap('s.productCount', 's.products');

    if (keyword) {
      qb.andWhere('s.name ILIKE :kw', { kw: `%${keyword}%` });
    }
    qb.orderBy('s.id', 'ASC').skip((page - 1) * pageSize).take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  async findOne(id: number): Promise<Site> {
    const entity = await this.siteRepo.findOne({ where: { id }, relations: ['products'] });
    if (!entity) throw new NotFoundException('站点不存在');
    return entity;
  }

  async create(dto: CreateSiteDto): Promise<Site> {
    const { productIds, ...rest } = dto;
    const entity = this.siteRepo.create(rest);
    const saved = await this.siteRepo.save(entity);
    if (productIds?.length) {
      await this.productRepo.update({ id: In(productIds) }, { siteId: saved.id } as any);
    }
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateSiteDto): Promise<Site> {
    const entity = await this.siteRepo.findOne({ where: { id }, relations: ['products'] });
    if (!entity) throw new NotFoundException('站点不存在');
    const { productIds, ...rest } = dto;
    Object.assign(entity, rest);
    await this.siteRepo.save(entity);
    if (productIds !== undefined) {
      // 清除旧关联
      if (entity.products?.length) {
        await this.productRepo.update({ siteId: id } as any, { siteId: null } as any);
      }
      // 设置新关联
      if (productIds.length) {
        await this.productRepo.update({ id: In(productIds) }, { siteId: id } as any);
      }
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.siteRepo.findOne({ where: { id }, relations: ['products'] });
    if (!entity) throw new NotFoundException('站点不存在');
    if (entity.products?.length) {
      throw new ConflictException(`该站点下有 ${entity.products.length} 个产品，请先移除关联`);
    }
    await this.siteRepo.remove(entity);
  }

  // ─── 日数据 ───

  async listDailyData(query: QueryDailyDataDto) {
    const { page = 1, pageSize = 10, siteId, startDate, endDate } = query;
    const qb = this.dailyRepo.createQueryBuilder('d')
      .leftJoinAndSelect('d.site', 'site');

    if (siteId) qb.andWhere('d.siteId = :siteId', { siteId });
    if (startDate) qb.andWhere('d.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('d.date <= :endDate', { endDate });

    qb.orderBy('d.date', 'DESC').skip((page - 1) * pageSize).take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  async findDailyData(id: number): Promise<SiteDailyData> {
    const entity = await this.dailyRepo.findOne({ where: { id }, relations: ['site'] });
    if (!entity) throw new NotFoundException('日数据不存在');
    return entity;
  }

  async createDailyData(dto: CreateDailyDataDto): Promise<SiteDailyData> {
    await this.checkSite(dto.siteId);
    const existing = await this.dailyRepo.findOne({ where: { date: dto.date, siteId: dto.siteId } });
    if (existing) throw new ConflictException('相同日期和站点的数据已存在');

    const entity = this.dailyRepo.create(dto);
    return this.dailyRepo.save(entity);
  }

  async updateDailyData(id: number, dto: Partial<CreateDailyDataDto>): Promise<SiteDailyData> {
    const entity = await this.dailyRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('日数据不存在');
    Object.assign(entity, dto);
    return this.dailyRepo.save(entity);
  }

  async removeDailyData(id: number): Promise<void> {
    const entity = await this.dailyRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('日数据不存在');
    await this.dailyRepo.remove(entity);
  }

  // ─── Excel 导入 ───

  async generateDailyTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('站点日数据模板');

    const headerRow = sheet.getRow(1);
    DAILY_COLUMNS.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = col.label;
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } };
      sheet.getColumn(i + 1).width = col.width;
    });

    const buf = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async importDailyExcel(buffer: Buffer, mode: string, siteId: number): Promise<{ success: number; failed: number; errors: string[] }> {
    const site = await this.siteRepo.findOne({ where: { id: siteId } });
    if (!site) throw new BadRequestException('站点不存在');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.getWorksheet(1);
    if (!sheet) throw new BadRequestException('Excel 文件中没有工作表');

    const errors: string[] = [];
    let success = 0, failed = 0;
    const rows: any[] = [];

    sheet.eachRow((row, rowNum) => {
      if (rowNum <= 2) return;
      const vals = row.values as any[];
      if (!vals || vals.every((v: any) => v === null || v === undefined || v === '')) return;

      const getStr = (col: number) => row.getCell(col).value?.toString()?.trim() ?? '';
      const getNum = (col: number) => {
        const v = row.getCell(col).value;
        if (v === null || v === undefined || v === '') return 0;
        const n = Number(v);
        return isNaN(n) ? 0 : n;
      };

      const date = getStr(1);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        errors.push(`第${rowNum}行：日期格式错误`);
        failed++;
        return;
      }

      rows.push({
        date,
        siteId,
        registrations: getNum(2),
        payingUsers: getNum(3),
        firstChargeUsers: getNum(4),
        entertainmentRevenue: getNum(5),
        entertainmentUsers: getNum(6),
        rechargeGold: getNum(7),
        exchangeAmount: getNum(8),
        exchangeUsers: getNum(9),
        retentionD1: getNum(10),
        retentionD7: getNum(11),
        retentionD30: getNum(12),
      });
    });

    // Process rows sequentially for reliable error handling
    for (const data of rows) {
      try {
        if (mode === 'append' || mode === '追加') {
          await this.dailyRepo.createQueryBuilder()
            .insert().into(SiteDailyData).values(data).orIgnore().execute();
        } else {
          await this.dailyRepo.createQueryBuilder()
            .insert().into(SiteDailyData).values(data)
            .orUpdate(
              ['registrations','payingUsers','firstChargeUsers','entertainmentRevenue','entertainmentUsers','rechargeGold','exchangeAmount','exchangeUsers','retentionD1','retentionD7','retentionD30'],
              ['date','site_id'],
            ).execute();
        }
        success++;
      } catch (err: any) {
        errors.push(`第${rows.indexOf(data) + 3}行：${err.message}`);
        failed++;
      }
    }

    this.logger.log(`导入完成: 成功 ${success}, 失败 ${failed}`);
    return { success, failed, errors };
  }

  private async checkSite(siteId: number): Promise<void> {
    const site = await this.siteRepo.findOne({ where: { id: siteId } });
    if (!site) throw new BadRequestException('站点不存在');
  }
}
