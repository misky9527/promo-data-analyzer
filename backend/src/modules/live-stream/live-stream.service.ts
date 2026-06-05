import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { LiveStreamData } from './entities/live-stream-data.entity';
import { LiveSite } from '../live-site/entities/live-site.entity';
import { ImportRecordService } from './import-record.service';
import { LogService } from '../log/log.service';
import { QueryLiveDataDto } from './dto/query-live-data.dto';
import { QueryDailySummaryDto } from './dto/query-daily-summary.dto';
import { QueryEventSummaryDto } from './dto/query-event-summary.dto';
import { QueryHostSummaryDto } from './dto/query-host-summary.dto';
import { QueryEventHostSummaryDto } from './dto/query-event-host-summary.dto';
import * as XLSX from 'xlsx';

export interface FileImportResult {
  fileName: string;
  success: number;
  failed: number;
  error?: string;
  duplicates?: number;
  siteCode?: string;
  liveDate?: string;
  recordCount?: number;
}

export interface MultiImportResult {
  files: FileImportResult[];
  totalSuccess: number;
  totalFailed: number;
}

@Injectable()
export class LiveStreamService {
  private readonly logger = new Logger(LiveStreamService.name);

  constructor(
    @InjectRepository(LiveStreamData)
    private readonly repo: Repository<LiveStreamData>,
    @InjectRepository(LiveSite)
    private readonly siteRepo: Repository<LiveSite>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly importRecordService: ImportRecordService,
    private readonly logService: LogService,
  ) {}

  // ═══════════════════════════════════════════════════════════
  // 分页查询（关联 siteName）
  // ═══════════════════════════════════════════════════════════

  async list(query: QueryLiveDataDto) {
    const { page = 1, pageSize = 10, siteCode, category, host, league, leagueId, liveInfo, liveDate, isPaid, sortField, sortOrder } = query;
    const qb = this.repo
      .createQueryBuilder('ls')
      .leftJoinAndSelect('ls.site', 'site')
      .where('ls.deletedAt IS NULL');

    if (siteCode) {
      qb.andWhere('UPPER(ls.siteCode) = UPPER(:siteCode)', { siteCode });
    }
    if (category) {
      qb.andWhere('ls.category LIKE :category', { category: `%${category}%` });
    }
    if (host) {
      qb.andWhere('ls.host = :host', { host });
    }
    if (league) {
      qb.andWhere('ls.league LIKE :league', { league: `%${league}%` });
    }
    if (leagueId) {
      qb.andWhere('ls.leagueId = :leagueId', { leagueId });
    }
    if (liveInfo) {
      qb.andWhere('ls.liveInfo LIKE :liveInfo', { liveInfo: `%${liveInfo}%` });
    }
    if (liveDate) {
      qb.andWhere('ls.liveDate = :liveDate', { liveDate });
    }
    if (isPaid) {
      qb.andWhere('ls.isPaid = :isPaid', { isPaid });
    }

    // 动态排序：指定字段按指定顺序，默认按开播时间倒序
    const sortCol = sortField || 'startTime';
    const sortDir = sortOrder === 'ascend' ? 'ASC' : 'DESC';
    qb.orderBy(`ls.${sortCol}`, sortDir)
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    // 展平：把 site.name 提升为 siteName
    const mapped = list.map((item) => ({
      ...item,
      siteName: (item.site as any)?.name ?? item.siteCode,
      site: undefined,
    }));

    return { list: mapped, total, page, pageSize };
  }

  // ═══════════════════════════════════════════════════════════
  // 每日汇总（按站点+日期 GROUP BY）
  // ═══════════════════════════════════════════════════════════

  async dailySummary(query: QueryDailySummaryDto) {
    const { page = 1, pageSize = 10, siteCode, liveDate } = query;

    const qb = this.repo
      .createQueryBuilder('ls')
      .leftJoin('ls.site', 'site')
      .select('ls.siteCode', 'siteCode')
      .addSelect('site.name', 'siteName')
      .addSelect('ls.liveDate', 'liveDate')
      .addSelect('COUNT(DISTINCT ls.host)', 'hostCount')
      .addSelect('SUM(ls.totalComments)', 'totalComments')
      .addSelect('SUM(ls.platformComments)', 'totalPlatformComments')
      .addSelect('SUM(ls.externalComments)', 'totalExternalComments')
      .addSelect('SUM(ls.hostComments)', 'totalHostComments')
      .addSelect('SUM(ls.avgStayVisit)', 'totalStayVisit')
      .addSelect('SUM(ls.avgStayPerson)', 'totalStayPerson')
      .addSelect('AVG(ls.peakOnline)', 'avgPeakOnline')
      .addSelect('SUM(ls.uv)', 'totalUv')
      .addSelect('SUM(ls.unlockCount)', 'totalUnlockCount')
      .addSelect('SUM(ls.unlockAmount)', 'totalUnlockAmount')
      .addSelect('SUM(ls.tipCount)', 'totalTipCount')
      .addSelect('SUM(ls.tipAmount)', 'totalTipAmount')
      .addSelect('COUNT(*)', 'streamCount')
      .where('ls.deletedAt IS NULL')
      .groupBy('ls.siteCode')
      .addGroupBy('site.name')
      .addGroupBy('ls.liveDate')
      .orderBy('ls.liveDate', 'DESC')
      .addOrderBy('ls.siteCode', 'ASC');

    if (siteCode) {
      qb.andWhere('UPPER(ls.siteCode) = UPPER(:siteCode)', { siteCode });
    }
    if (liveDate) {
      qb.andWhere('ls.liveDate = :liveDate', { liveDate });
    }

    const offset = (page - 1) * pageSize;
    const rawList: any[] = await qb.offset(offset).limit(pageSize).getRawMany();

    // 还需要获取 total count
    const countQb = this.repo
      .createQueryBuilder('ls')
      .leftJoin('ls.site', 'site')
      .select('COUNT(DISTINCT CONCAT(ls.siteCode, ls.liveDate))', 'total')
      .where('ls.deletedAt IS NULL');

    if (siteCode) {
      countQb.andWhere('UPPER(ls.siteCode) = UPPER(:siteCode)', { siteCode });
    }
    if (liveDate) {
      countQb.andWhere('ls.liveDate = :liveDate', { liveDate });
    }

    const countResult = await countQb.getRawOne();
    const total = parseInt(countResult?.total || '0', 10);

    const list = rawList.map((r) => ({
      siteCode: r.siteCode,
      siteName: r.siteName ?? r.siteCode,
      liveDate: r.liveDate,
      hostCount: parseInt(r.hostCount, 10),
      totalComments: parseInt(r.totalComments, 10),
      totalPlatformComments: parseInt(r.totalPlatformComments, 10),
      totalExternalComments: parseInt(r.totalExternalComments, 10),
      totalHostComments: parseInt(r.totalHostComments, 10),
      totalStayVisit: r.totalStayVisit ? parseInt(r.totalStayVisit, 10) : 0,
      totalStayPerson: r.totalStayPerson ? parseInt(r.totalStayPerson, 10) : 0,
      avgPeakOnline: r.avgPeakOnline ? Math.round(parseFloat(r.avgPeakOnline)) : 0,
      totalUv: r.totalUv ? parseInt(r.totalUv, 10) : 0,
      totalUnlockCount: r.totalUnlockCount ? parseInt(r.totalUnlockCount, 10) : 0,
      totalUnlockAmount: r.totalUnlockAmount ? parseFloat(r.totalUnlockAmount) : 0,
      totalTipCount: r.totalTipCount ? parseInt(r.totalTipCount, 10) : 0,
      totalTipAmount: r.totalTipAmount ? parseFloat(r.totalTipAmount) : 0,
      streamCount: parseInt(r.streamCount, 10),
    }));

    return { list, total, page, pageSize };
  }

  // ═══════════════════════════════════════════════════════════
  // 赛事汇总（按赛事+日期 GROUP BY）
  // ═══════════════════════════════════════════════════════════

  async eventSummary(query: QueryEventSummaryDto) {
    const { page = 1, pageSize = 10, liveDate, eventName, eventId, sortField, sortOrder } = query;

    const qb = this.repo
      .createQueryBuilder('ls')
      .leftJoin('ls.site', 'site')
      .select('ls.eventId', 'eventId')
      .addSelect('ls.eventTime', 'eventTime')
      .addSelect('ls.eventName', 'eventName')
      .addSelect('ls.liveDate', 'liveDate')
      .addSelect('COUNT(DISTINCT ls.roomId)', 'roomCount')
      .addSelect('ls.league', 'league')
      .addSelect('ls.category', 'category')
      .addSelect('COUNT(DISTINCT ls.host)', 'hostCount')
      .addSelect('SUM(ls.totalComments)', 'totalComments')
      .addSelect('SUM(ls.platformComments)', 'totalPlatformComments')
      .addSelect('SUM(ls.externalComments)', 'totalExternalComments')
      .addSelect('SUM(ls.hostComments)', 'totalHostComments')
      .addSelect('SUM(ls.avgStayPerson)', 'totalStayPerson')
      .addSelect('SUM(ls.avgStayVisit)', 'totalStayVisit')
      .addSelect('AVG(ls.peakOnline)', 'avgPeakOnline')
      .addSelect('SUM(ls.uv)', 'totalUv')
      .addSelect('SUM(ls.unlockCount)', 'totalUnlockCount')
      .addSelect('SUM(ls.unlockAmount)', 'totalUnlockAmount')
      .addSelect('SUM(ls.tipCount)', 'totalTipCount')
      .addSelect('SUM(ls.tipAmount)', 'totalTipAmount')
      .groupBy('ls.eventId')
      .addGroupBy('ls.eventTime')
      .addGroupBy('ls.eventName')
      .addGroupBy('ls.liveDate')
      .addGroupBy('ls.league')
      .addGroupBy('ls.category')
      .where('ls.deletedAt IS NULL');

    if (liveDate) {
      qb.andWhere('ls.liveDate = :liveDate', { liveDate });
    }
    if (eventName) {
      qb.andWhere('ls.eventName LIKE :eventName', { eventName: `%${eventName}%` });
    }
    if (eventId) {
      qb.andWhere('ls.eventId = :eventId', { eventId });
    }

    // 排序：支持按 totalComments / totalStayPerson / avgPeakOnline 排序
    if (sortField) {
      const sortDir = sortOrder === 'ascend' ? 'ASC' : 'DESC';
      qb.orderBy(`"${sortField}"`, sortDir);
    } else {
      qb.orderBy('"totalComments"', 'DESC');
    }
    qb.addOrderBy('ls.liveDate', 'DESC');

    const offset = (page - 1) * pageSize;
    const rawList: any[] = await qb.offset(offset).limit(pageSize).getRawMany();

    // 总数
    const countQb = this.repo
      .createQueryBuilder('ls')
      .select(
        'COUNT(DISTINCT CONCAT(COALESCE(ls.eventId, \'\'), ls.eventTime, ls.eventName, ls.liveDate, ls.league, ls.category))',
        'total',
      )
      .where('ls.deletedAt IS NULL');
    if (liveDate) {
      countQb.andWhere('ls.liveDate = :liveDate', { liveDate });
    }
    if (eventName) {
      countQb.andWhere('ls.eventName LIKE :eventName', { eventName: `%${eventName}%` });
    }
    if (eventId) {
      countQb.andWhere('ls.eventId = :eventId', { eventId });
    }
    const countResult = await countQb.getRawOne();
    const total = parseInt(countResult?.total || '0', 10);

    const list = rawList.map((r) => ({
      eventId: r.eventId,
      eventTime: r.eventTime,
      eventName: r.eventName,
      liveDate: r.liveDate,
      roomCount: parseInt(r.roomCount, 10),
      league: r.league,
      category: r.category,
      hostCount: parseInt(r.hostCount, 10),
      totalComments: parseInt(r.totalComments, 10),
      totalPlatformComments: r.totalPlatformComments ? parseInt(r.totalPlatformComments, 10) : 0,
      totalExternalComments: r.totalExternalComments ? parseInt(r.totalExternalComments, 10) : 0,
      totalHostComments: r.totalHostComments ? parseInt(r.totalHostComments, 10) : 0,
      totalStayVisit: r.totalStayVisit ? Math.round(parseFloat(r.totalStayVisit)) : 0,
      totalStayPerson: r.totalStayPerson ? Math.round(parseFloat(r.totalStayPerson)) : 0,
      avgPeakOnline: r.avgPeakOnline ? Math.round(parseFloat(r.avgPeakOnline)) : 0,
      totalUv: r.totalUv ? parseInt(r.totalUv, 10) : 0,
      totalUnlockCount: r.totalUnlockCount ? parseInt(r.totalUnlockCount, 10) : 0,
      totalUnlockAmount: r.totalUnlockAmount ? parseFloat(r.totalUnlockAmount) : 0,
      totalTipCount: r.totalTipCount ? parseInt(r.totalTipCount, 10) : 0,
      totalTipAmount: r.totalTipAmount ? parseFloat(r.totalTipAmount) : 0,
    }));

    return { list, total, page, pageSize };
  }

  // ═══════════════════════════════════════════════════════════
  // 同赛事主播汇总（查看明细）
  // ═══════════════════════════════════════════════════════════

  async hostSummary(query: QueryHostSummaryDto) {
    const { eventName, liveDate, page = 1, pageSize = 100 } = query;

    const baseQb = this.repo
      .createQueryBuilder('ls')
      .leftJoin('ls.site', 'site')
      .select('ls.host', 'host')
      .addSelect('ls.siteCode', 'siteCode')
      .addSelect('site.name', 'siteName')
      .addSelect('SUM(ls.duration)', 'totalDuration')
      .addSelect('SUM(ls.totalComments)', 'totalComments')
      .addSelect('AVG(ls.avgStayVisit)', 'avgStayVisit')
      .addSelect('AVG(ls.avgStayPerson)', 'avgStayPerson')
      .addSelect('AVG(ls.peakOnline)', 'avgPeakOnline')
      .where('ls.deletedAt IS NULL')
      .andWhere('ls.eventName = :eventName', { eventName })
      .andWhere('ls.liveDate = :liveDate', { liveDate })
      .groupBy('ls.host')
      .addGroupBy('ls.siteCode')
      .addGroupBy('site.name');

    // 总数
    const countResult = await baseQb.clone().getRawMany();
    const total = countResult.length;

    // 分页数据
    const dataQb = baseQb
      .clone()
      .orderBy('host', 'ASC')
      .offset((page - 1) * pageSize)
      .limit(pageSize);
    const rawList: any[] = await dataQb.getRawMany();

    const list = rawList.map((r) => ({
      host: r.host,
      siteCode: r.siteCode,
      siteName: r.siteName ?? r.siteCode,
      duration: r.totalDuration ? parseInt(r.totalDuration, 10) : 0,
      commentCount: r.totalComments ? parseInt(r.totalComments, 10) : 0,
      avgStayVisit: r.avgStayVisit ? Math.round(parseFloat(r.avgStayVisit)) : 0,
      avgStayPerson: r.avgStayPerson ? Math.round(parseFloat(r.avgStayPerson)) : 0,
      avgPeakOnline: r.avgPeakOnline ? Math.round(parseFloat(r.avgPeakOnline)) : 0,
    }));

    return { list, total, page, pageSize };
  }

  // ═══════════════════════════════════════════════════════════
  // 赛事主播汇总（赛事+日期维度，按主播聚合）
  // ═══════════════════════════════════════════════════════════

  async eventHostSummary(query: QueryEventHostSummaryDto) {
    const { eventName, host, liveDate, page = 1, pageSize = 20 } = query;

    const baseQb = this.repo
      .createQueryBuilder('ls')
      .select('ls.eventName', 'eventName')
      .addSelect('ls.liveDate', 'liveDate')
      .addSelect('ls.host', 'host')
      .addSelect('COUNT(DISTINCT ls.siteCode)', 'siteCount')
      .addSelect(
        'CAST(SUM(ls.duration) / COUNT(DISTINCT ls.siteCode) AS INTEGER)',
        'avgDuration',
      )
      .addSelect('SUM(ls.totalComments)', 'totalComments')
      .addSelect('AVG(ls.avgStayVisit)', 'avgStayVisit')
      .addSelect('AVG(ls.avgStayPerson)', 'avgStayPerson')
      .addSelect('AVG(ls.peakOnline)', 'avgPeakOnline')
      .where('ls.deletedAt IS NULL')
      .andWhere('ls.eventName IS NOT NULL')
      .andWhere("ls.eventName != ''")
      .groupBy('ls.eventName')
      .addGroupBy('ls.liveDate')
      .addGroupBy('ls.host');

    if (eventName) {
      baseQb.andWhere('ls.eventName ILIKE :eventName', {
        eventName: `%${eventName}%`,
      });
    }

    if (host) {
      baseQb.andWhere('ls.host ILIKE :host', {
        host: `%${host}%`,
      });
    }

    if (liveDate) {
      baseQb.andWhere('ls.liveDate = :liveDate', { liveDate });
    }

    // 总数
    const countResult = await baseQb.clone().getRawMany();
    const total = countResult.length;

    // 分页数据
    const dataQb = baseQb
      .clone()
      .orderBy('ls.eventName', 'ASC')
      .addOrderBy('ls.liveDate', 'DESC')
      .addOrderBy('ls.host', 'ASC')
      .offset((page - 1) * pageSize)
      .limit(pageSize);
    const rawList: any[] = await dataQb.getRawMany();

    const list = rawList.map((r) => ({
      eventName: r.eventName,
      liveDate: r.liveDate,
      host: r.host,
      siteCount: parseInt(r.siteCount, 10),
      avgDuration: r.avgDuration ? parseInt(r.avgDuration, 10) : 0,
      totalComments: r.totalComments ? parseInt(r.totalComments, 10) : 0,
      avgStayVisit: r.avgStayVisit ? Math.round(parseFloat(r.avgStayVisit)) : 0,
      avgStayPerson: r.avgStayPerson ? Math.round(parseFloat(r.avgStayPerson)) : 0,
      avgPeakOnline: r.avgPeakOnline ? Math.round(parseFloat(r.avgPeakOnline)) : 0,
    }));

    return { list, total, page, pageSize };
  }

  // ═══════════════════════════════════════════════════════════
  // 多文件 CSV 导入
  // ═══════════════════════════════════════════════════════════

  async importCsv(
    files: Array<{ originalname: string; buffer: Buffer }>,
    dedupMode?: 'overwrite' | 'ignore',
    operator?: string,
  ): Promise<MultiImportResult> {
    const results: FileImportResult[] = [];

    // 预加载所有站点 code
    const sites = await this.siteRepo.find();
    const siteCodeSet = new Set(sites.map((s) => s.code?.toUpperCase()));

    // 预加载现有记录的去重键（siteCode + liveDate）
    const existingRows = await this.repo.find({ select: ['siteCode', 'liveDate'] });
    const existingKeys = new Set(
      existingRows.map((r) => `${r.siteCode}|${r.liveDate}`),
    );

    for (const file of files) {
      const fileName = file.originalname;
      try {
        const fileResult = await this.processOneFile(file, siteCodeSet, existingKeys, dedupMode, operator);
        results.push(fileResult);

        // 导入成功后写入导入记录
        if (fileResult.success > 0 && fileResult.siteCode && fileResult.liveDate) {
          try {
            await this.importRecordService.create({
              fileName: fileResult.fileName,
              siteCode: fileResult.siteCode,
              liveDate: fileResult.liveDate,
              recordCount: fileResult.recordCount ?? fileResult.success,
              operator: operator ?? 'system',
            });
          } catch (err: any) {
            this.logger.error(`创建导入记录失败 (${fileName}): ${err.message}`);
          }
        }
      } catch (err: any) {
        this.logger.error(`文件 ${fileName} 导入失败: ${err.message}`);
        results.push({
          fileName,
          success: 0,
          failed: 0,
          error: err.message,
        });
      }
    }

    return {
      files: results,
      totalSuccess: results.reduce((s, r) => s + r.success, 0),
      totalFailed: results.reduce((s, r) => s + r.failed, 0),
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 单文件处理（事务：全成功才入库）— 25 列 XLSX 格式
  // ═══════════════════════════════════════════════════════════

  private async processOneFile(
    file: { originalname: string; buffer: Buffer },
    siteCodeSet: Set<string>,
    existingKeys: Set<string>,
    dedupMode?: 'overwrite' | 'ignore',
    operator?: string,
  ): Promise<FileImportResult> {
    const fileName = file.originalname;

    // 解析文件名: DJ-2026-06-03_2---c333f603-408d-4533-b8a1-5904415f559b.xlsx
    // siteCode = 第一个 _ 前的部分, liveDate = 从 _ 前提取 YYYY-MM-DD
    const nameWithoutExt = fileName.replace(/\.(csv|xlsx)$/i, '');
    const fileNameMatch = nameWithoutExt.match(/^([a-zA-Z0-9]+)-(\d{4}-\d{2}-\d{2})_/);

    let siteCode: string;
    let liveDate: string;

    if (fileNameMatch) {
      siteCode = fileNameMatch[1].toUpperCase();
      liveDate = fileNameMatch[2];
    } else {
      // 兼容旧格式（无 UUID 后缀）: {code}-{date}
      const mOld = nameWithoutExt.match(/^([a-zA-Z0-9_-]+?)-(\d{4}-\d{1,2}-\d{1,2})$/);
      if (mOld) {
        siteCode = mOld[1].toUpperCase();
        liveDate = mOld[2].replace(/\./g, '-');
      } else {
        return { fileName, success: 0, failed: 1, error: `文件名格式不匹配: 期望 {code}-YYYY-MM-DD_N---uuid.xlsx` };
      }
    }

    // 验证 site_code 存在
    if (!siteCodeSet.has(siteCode)) {
      return { fileName, success: 0, failed: 1, error: `站点 code "${siteCode}" 在 live_site 表中不存在` };
    }

    // XLSX 列号方式读取（列序号从 1 开始）
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { fileName, success: 0, failed: 1, error: 'XLSX 文件中无工作表' };
    }
    const sheet = workbook.Sheets[sheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    // 第 1 行: 表头（跳过），第 2 行起: 数据
    const dataRows = rawRows.slice(1).filter((row: any[]) => row.some((c: any) => c !== ''));

    if (dataRows.length === 0) {
      return { fileName, success: 0, failed: 1, error: '文件内容为空' };
    }

    const entities: LiveStreamData[] = [];
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = dataRows[i];

        // 25 列校验（列号 1~25，数组索引 0~24）
        if (row.length < 25) {
          errors.push(`第 ${i + 2} 行: 列数不足 (需要 ≥25 列，实际 ${row.length} 列)`);
          failed++;
          continue;
        }

        // 列1: 直播间ID (索引0)
        const roomId = String(row[0]).trim();
        if (!roomId) {
          errors.push(`第 ${i + 2} 行: 直播间ID 为空`);
          failed++;
          continue;
        }

        // 列9: 开播时间 (索引8)
        const startTimeStr = String(row[8]).trim();
        if (!startTimeStr) {
          errors.push(`第 ${i + 2} 行: 开播时间 为空`);
          failed++;
          continue;
        }
        const startTime = new Date(startTimeStr.replace(' ', 'T') + '+08:00');
        if (isNaN(startTime.getTime())) {
          errors.push(`第 ${i + 2} 行: 无法解析开播时间 "${startTimeStr}"`);
          failed++;
          continue;
        }

        // 列2: 联赛ID (索引1)
        const leagueId = String(row[1]).trim() || null;

        // 列5: 直播信息 (索引4) → 拆分为 eventTime, league, eventName
        const rawLiveInfo = String(row[4]).trim();
        let eventTime: string | null = null;
        let league: string | null = null;
        let eventName: string | null = null;
        if (rawLiveInfo) {
          const firstSpace = rawLiveInfo.indexOf(' ');
          if (firstSpace > 0) {
            eventTime = rawLiveInfo.slice(0, firstSpace).trim() || null;
            const afterFirst = rawLiveInfo.slice(firstSpace + 1).trim();
            const secondSpace = afterFirst.indexOf(' ');
            if (secondSpace > 0) {
              league = afterFirst.slice(0, secondSpace).trim() || null;
              eventName = afterFirst.slice(secondSpace + 1).trim() || null;
            } else {
              eventName = afterFirst.trim() || null;
            }
          } else {
            eventName = rawLiveInfo;
          }
        }

        // 列3: 联赛名称 (索引2) — 如果直播信息未解析出 league，回退到列3
        if (!league) {
          league = String(row[2]).trim() || null;
        }

        // 列4: 赛事ID (索引3) — 不再写null，存实际值
        const eventId = String(row[3]).trim() || null;

        // 列6: 直播类型 (索引5)
        const category = String(row[5]).trim() || null;

        // 列7: 主播 (索引6)
        const host = String(row[6]).trim() || null;

        // 列8: 是否付费 (索引7)
        const isPaid = String(row[7]).trim() || null;

        // 列10: 开播时长 (索引9) — "1小时39分0秒" → 秒
        let duration: number | null = null;
        const durStr = String(row[9]).trim();
        if (durStr) {
          duration = this.parseDuration(durStr);
        }

        // 列11: 用户评论数(总) (索引10)
        let totalComments = 0;
        const tcStr = String(row[10]).trim();
        if (tcStr) {
          const n = parseInt(tcStr.replace(/,/g, ''), 10);
          if (!isNaN(n)) totalComments = n;
        }

        // 列12: 用户评论数(自平台) (索引11)
        let platformComments = 0;
        const pcStr = String(row[11]).trim();
        if (pcStr) {
          const n = parseInt(pcStr.replace(/,/g, ''), 10);
          if (!isNaN(n)) platformComments = n;
        }

        // 列13: 用户评论数(他平台) (索引12)
        let externalComments = 0;
        const ecStr = String(row[12]).trim();
        if (ecStr) {
          const n = parseInt(ecStr.replace(/,/g, ''), 10);
          if (!isNaN(n)) externalComments = n;
        }

        // 列14: 主播评论数 (索引13)
        let hostComments = 0;
        const hcStr = String(row[13]).trim();
        if (hcStr) {
          const n = parseInt(hcStr.replace(/,/g, ''), 10);
          if (!isNaN(n)) hostComments = n;
        }

        // 列15: 次均停留时长 (索引14) — "3分22秒" → 秒
        let avgStayVisit: number | null = null;
        const asvStr = String(row[14]).trim();
        if (asvStr) {
          avgStayVisit = this.parseDuration(asvStr);
        }

        // 列16: 人均停留时长 (索引15) — "2分33秒" → 秒
        let avgStayPerson: number | null = null;
        const aspStr = String(row[15]).trim();
        if (aspStr) {
          avgStayPerson = this.parseDuration(aspStr);
        }

        // 列17: 峰值同时在线人数 (索引16)
        let peakOnline: number | null = null;
        const poStr = String(row[16]).trim();
        if (poStr) {
          const n = parseInt(poStr.replace(/,/g, ''), 10);
          if (!isNaN(n)) peakOnline = n;
        }

        // 列18: 直播间UV (索引17)
        let uv = 0;
        const uvStr = String(row[17]).trim();
        if (uvStr) {
          const n = parseInt(uvStr.replace(/,/g, ''), 10);
          if (!isNaN(n)) uv = n;
        }

        // 列19: 解锁直播人数 (索引18)
        let unlockCount = 0;
        const uccStr = String(row[18]).trim();
        if (uccStr) {
          const n = parseInt(uccStr.replace(/,/g, ''), 10);
          if (!isNaN(n)) unlockCount = n;
        }

        // 列20: 解锁直播金额 (索引19)
        let unlockAmount = 0;
        const uaStr = String(row[19]).trim();
        if (uaStr) {
          const n = parseFloat(uaStr.replace(/,/g, ''));
          if (!isNaN(n)) unlockAmount = n;
        }

        // 列21: 打赏人数 (索引20)
        let tipCount = 0;
        const tpcStr = String(row[20]).trim();
        if (tpcStr) {
          const n = parseInt(tpcStr.replace(/,/g, ''), 10);
          if (!isNaN(n)) tipCount = n;
        }

        // 列22: 打赏金额 (索引21)
        let tipAmount = 0;
        const taStr = String(row[21]).trim();
        if (taStr) {
          const n = parseFloat(taStr.replace(/,/g, ''));
          if (!isNaN(n)) tipAmount = n;
        }

        // 列23: 收券人数 (索引22)
        let couponCount = 0;
        const ccStr2 = String(row[22]).trim();
        if (ccStr2) {
          const n = parseInt(ccStr2.replace(/,/g, ''), 10);
          if (!isNaN(n)) couponCount = n;
        }

        // 列24: 解锁方案金额 (索引23)
        let planAmount = 0;
        const paStr = String(row[23]).trim();
        if (paStr) {
          const n = parseFloat(paStr.replace(/,/g, ''));
          if (!isNaN(n)) planAmount = n;
        }

        // 列25: 解锁套餐金额 (索引24)
        let packageAmount = 0;
        const pkaStr = String(row[24]).trim();
        if (pkaStr) {
          const n = parseFloat(pkaStr.replace(/,/g, ''));
          if (!isNaN(n)) packageAmount = n;
        }

        entities.push(
          this.repo.create({
            siteCode,
            liveDate,
            roomId,
            leagueId,
            liveInfo: rawLiveInfo || null,
            eventTime,
            league,
            eventName,
            eventId,
            category,
            host,
            isPaid,
            startTime,
            duration,
            commentCount: totalComments,
            totalComments,
            platformComments,
            externalComments,
            hostComments,
            avgStayVisit,
            avgStayPerson,
            peakOnline,
            uv,
            unlockCount,
            unlockAmount,
            tipCount,
            tipAmount,
            couponCount,
            planAmount,
            packageAmount,
          }),
        );
        success++;
      } catch (err: any) {
        errors.push(`第 ${i + 2} 行: ${err.message}`);
        failed++;
      }
    }

    // 如果有失败行，整体回滚
    if (failed > 0) {
      return {
        fileName,
        success: 0,
        failed,
        error: errors.join('; '),
      };
    }

    // 去重检查（按 siteCode + liveDate 整批）
    const dateKey = `${siteCode}|${liveDate}`;
    if (existingKeys.has(dateKey)) {
      if (!dedupMode) {
        return {
          fileName,
          success: 0,
          failed: entities.length,
          error: `${liveDate} 已有导入数据，是否覆盖？`,
          duplicates: entities.length,
        } as any;
      }

      if (dedupMode === 'overwrite') {
        // 覆盖：删除该站点+该日期的所有旧数据，再插入新数据
        await this.dataSource.transaction(async (manager) => {
          await manager.delete(LiveStreamData, { siteCode, liveDate });
          await manager.save(entities, { chunk: 200 });
        });
        this.logger.log(`文件 ${fileName}: 覆盖导入 ${success} 条 (站点 ${siteCode} 日期 ${liveDate} 已覆盖)`);

        // 写入操作日志（事务外）
        const op = operator ?? 'system';
        this.logService.create({
          operationType: 'import',
          description: `导入文件 ${fileName}，站点 ${siteCode}，日期 ${liveDate}，${entities.length} 条`,
          operator: op,
          targetTable: 'live_stream_data',
          recordCount: entities.length,
        }).catch((err: any) => this.logger.error(`导入日志写入失败: ${err.message}`));

        return {
          fileName,
          success: entities.length,
          failed: 0,
          duplicates: entities.length,
          siteCode,
          liveDate,
          recordCount: entities.length,
        } as any;
      }

      // ignore（取消）: 跳过该文件
      return {
        fileName,
        success: 0,
        failed: entities.length,
        error: `已取消导入（${liveDate} 已有数据）`,
        duplicates: entities.length,
      } as any;
    }

    // 无重复 → 事务批量插入
    if (entities.length > 0) {
      await this.dataSource.transaction(async (manager) => {
        await manager.save(entities, { chunk: 200 });
      });
      this.logger.log(`文件 ${fileName}: 成功导入 ${success} 条`);
    }

    // 写入操作日志（事务外）
    const op = operator ?? 'system';
    this.logService.create({
      operationType: 'import',
      description: `导入文件 ${fileName}，站点 ${siteCode}，日期 ${liveDate}，${entities.length} 条`,
      operator: op,
      targetTable: 'live_stream_data',
      recordCount: entities.length,
    }).catch((err: any) => this.logger.error(`导入日志写入失败: ${err.message}`));

    return { fileName, success, failed: 0, siteCode, liveDate, recordCount: entities.length };
  }

  // ═══════════════════════════════════════════════════════════
  // 删除
  // ═══════════════════════════════════════════════════════════

  async remove(id: number): Promise<void> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('记录不存在');
    await this.repo.remove(entity);
  }

  async batchRemove(ids: number[]): Promise<void> {
    const entities = await this.repo.findBy({ id: In(ids) });
    if (entities.length === 0) throw new NotFoundException('没有找到可删除的记录');
    await this.repo.remove(entities);
  }

  // ═══════════════════════════════════════════════════════════
  // 工具方法
  // ═══════════════════════════════════════════════════════════

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result.map((s) => s.replace(/^"|"$/g, '').trim());
  }

  /** 解析时长字符串 "2小时11分3秒" / "3分22秒" → 秒 */
  private parseDuration(str: string): number | null {
    const match = str.match(/(?:(\d+)\s*小时)?(?:(\d+)\s*分)?(?:(\d+)\s*秒)?/);
    if (match && (match[1] || match[2] || match[3])) {
      const h = parseInt(match[1] || '0', 10);
      const m = parseInt(match[2] || '0', 10);
      const s = parseInt(match[3] || '0', 10);
      return h * 3600 + m * 60 + s;
    }
    const n = parseInt(str, 10);
    return isNaN(n) ? null : n;
  }

  /** 解析日期字符串（中文或标准格式） */
  private parseDateString(str: string): string | null {
    const cnMatch = str.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*号?/);
    if (cnMatch) {
      return `${cnMatch[1]}-${cnMatch[2].padStart(2, '0')}-${cnMatch[3].padStart(2, '0')}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
    return null;
  }
}
