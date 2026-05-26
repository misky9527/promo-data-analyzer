import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { LiveStreamData } from './entities/live-stream-data.entity';
import { LiveSite } from '../live-site/entities/live-site.entity';
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
  ) {}

  // ═══════════════════════════════════════════════════════════
  // 分页查询（关联 siteName）
  // ═══════════════════════════════════════════════════════════

  async list(query: QueryLiveDataDto) {
    const { page = 1, pageSize = 10, siteCode, category, host, league, liveInfo, liveDate, sortField, sortOrder } = query;
    const qb = this.repo
      .createQueryBuilder('ls')
      .leftJoinAndSelect('ls.site', 'site');

    if (siteCode) {
      qb.andWhere('ls.siteCode = :siteCode', { siteCode });
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
    if (liveInfo) {
      qb.andWhere('ls.liveInfo LIKE :liveInfo', { liveInfo: `%${liveInfo}%` });
    }
    if (liveDate) {
      qb.andWhere('ls.liveDate = :liveDate', { liveDate });
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
      .addSelect('SUM(ls.commentCount)', 'totalComments')
      .addSelect('SUM(ls.avgStayVisit)', 'totalStayVisit')
      .addSelect('SUM(ls.avgStayPerson)', 'totalStayPerson')
      .addSelect('AVG(ls.peakOnline)', 'avgPeakOnline')
      .addSelect('COUNT(*)', 'streamCount')
      .groupBy('ls.siteCode')
      .addGroupBy('site.name')
      .addGroupBy('ls.liveDate')
      .orderBy('ls.liveDate', 'DESC')
      .addOrderBy('ls.siteCode', 'ASC');

    if (siteCode) {
      qb.andWhere('ls.siteCode = :siteCode', { siteCode });
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
      .select('COUNT(DISTINCT CONCAT(ls.siteCode, ls.liveDate))', 'total');

    if (siteCode) {
      countQb.andWhere('ls.siteCode = :siteCode', { siteCode });
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
      totalStayVisit: r.totalStayVisit ? parseInt(r.totalStayVisit, 10) : 0,
      totalStayPerson: r.totalStayPerson ? parseInt(r.totalStayPerson, 10) : 0,
      avgPeakOnline: r.avgPeakOnline ? Math.round(parseFloat(r.avgPeakOnline)) : 0,
      streamCount: parseInt(r.streamCount, 10),
    }));

    return { list, total, page, pageSize };
  }

  // ═══════════════════════════════════════════════════════════
  // 赛事汇总（按赛事+日期 GROUP BY）
  // ═══════════════════════════════════════════════════════════

  async eventSummary(query: QueryEventSummaryDto) {
    const { page = 1, pageSize = 10, liveDate, eventName, sortField, sortOrder } = query;

    const qb = this.repo
      .createQueryBuilder('ls')
      .leftJoin('ls.site', 'site')
      .select('ls.eventTime', 'eventTime')
      .addSelect('ls.eventName', 'eventName')
      .addSelect('ls.liveDate', 'liveDate')
      .addSelect('COUNT(DISTINCT ls.roomId)', 'roomCount')
      .addSelect('ls.league', 'league')
      .addSelect('ls.category', 'category')
      .addSelect('COUNT(DISTINCT ls.host)', 'hostCount')
      .addSelect('SUM(ls.commentCount)', 'totalComments')
      .addSelect('SUM(ls.avgStayPerson)', 'totalStayPerson')
      .addSelect('AVG(ls.peakOnline)', 'avgPeakOnline')
      .groupBy('ls.eventTime')
      .addGroupBy('ls.eventName')
      .addGroupBy('ls.liveDate')
      .addGroupBy('ls.league')
      .addGroupBy('ls.category');

    if (liveDate) {
      qb.andWhere('ls.liveDate = :liveDate', { liveDate });
    }
    if (eventName) {
      qb.andWhere('ls.eventName LIKE :eventName', { eventName: `%${eventName}%` });
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
        'COUNT(DISTINCT CONCAT(ls.eventTime, ls.eventName, ls.liveDate, ls.league, ls.category))',
        'total',
      );
    if (liveDate) {
      countQb.andWhere('ls.liveDate = :liveDate', { liveDate });
    }
    if (eventName) {
      countQb.andWhere('ls.eventName LIKE :eventName', { eventName: `%${eventName}%` });
    }
    const countResult = await countQb.getRawOne();
    const total = parseInt(countResult?.total || '0', 10);

    const list = rawList.map((r) => ({
      eventTime: r.eventTime,
      eventName: r.eventName,
      liveDate: r.liveDate,
      roomCount: parseInt(r.roomCount, 10),
      league: r.league,
      category: r.category,
      hostCount: parseInt(r.hostCount, 10),
      totalComments: parseInt(r.totalComments, 10),
      totalStayPerson: r.totalStayPerson ? Math.round(parseFloat(r.totalStayPerson)) : 0,
      avgPeakOnline: r.avgPeakOnline ? Math.round(parseFloat(r.avgPeakOnline)) : 0,
    }));

    return { list, total, page, pageSize };
  }

  // ═══════════════════════════════════════════════════════════
  // 同赛事主播汇总（查看明细，不分页）
  // ═══════════════════════════════════════════════════════════

  async hostSummary(query: QueryHostSummaryDto) {
    const { eventName, liveDate } = query;

    const qb = this.repo
      .createQueryBuilder('ls')
      .leftJoin('ls.site', 'site')
      .select('ls.host', 'host')
      .addSelect('ls.siteCode', 'siteCode')
      .addSelect('site.name', 'siteName')
      .addSelect('SUM(ls.duration)', 'totalDuration')
      .addSelect('SUM(ls.commentCount)', 'totalComments')
      .addSelect('AVG(ls.avgStayVisit)', 'avgStayVisit')
      .addSelect('AVG(ls.avgStayPerson)', 'avgStayPerson')
      .addSelect('AVG(ls.peakOnline)', 'avgPeakOnline')
      .where('ls.eventName = :eventName', { eventName })
      .andWhere('ls.liveDate = :liveDate', { liveDate })
      .groupBy('ls.host')
      .addGroupBy('ls.siteCode')
      .addGroupBy('site.name')
      .orderBy('host', 'ASC');

    const rawList: any[] = await qb.getRawMany();

    return rawList.map((r) => ({
      host: r.host,
      siteCode: r.siteCode,
      siteName: r.siteName ?? r.siteCode,
      duration: r.totalDuration ? parseInt(r.totalDuration, 10) : 0,
      commentCount: r.totalComments ? parseInt(r.totalComments, 10) : 0,
      avgStayVisit: r.avgStayVisit ? Math.round(parseFloat(r.avgStayVisit)) : 0,
      avgStayPerson: r.avgStayPerson ? Math.round(parseFloat(r.avgStayPerson)) : 0,
      avgPeakOnline: r.avgPeakOnline ? Math.round(parseFloat(r.avgPeakOnline)) : 0,
    }));
  }

  // ═══════════════════════════════════════════════════════════
  // 赛事主播汇总（赛事+日期维度，按主播聚合）
  // ═══════════════════════════════════════════════════════════

  async eventHostSummary(query: QueryEventHostSummaryDto) {
    const { eventName } = query;

    const qb = this.repo
      .createQueryBuilder('ls')
      .select('ls.eventName', 'eventName')
      .addSelect('ls.liveDate', 'liveDate')
      .addSelect('ls.host', 'host')
      .addSelect('COUNT(DISTINCT ls.siteCode)', 'siteCount')
      .addSelect(
        'CAST(SUM(ls.duration) / COUNT(DISTINCT ls.siteCode) AS INTEGER)',
        'avgDuration',
      )
      .addSelect('SUM(ls.commentCount)', 'totalComments')
      .addSelect('AVG(ls.avgStayVisit)', 'avgStayVisit')
      .addSelect('AVG(ls.avgStayPerson)', 'avgStayPerson')
      .addSelect('AVG(ls.peakOnline)', 'avgPeakOnline')
      .where('ls.eventName IS NOT NULL')
      .andWhere("ls.eventName != ''")
      .groupBy('ls.eventName')
      .addGroupBy('ls.liveDate')
      .addGroupBy('ls.host')
      .orderBy('ls.eventName', 'ASC')
      .addOrderBy('ls.liveDate', 'DESC')
      .addOrderBy('ls.host', 'ASC');

    if (eventName) {
      qb.andWhere('ls.eventName ILIKE :eventName', {
        eventName: `%${eventName}%`,
      });
    }

    const rawList: any[] = await qb.getRawMany();

    return rawList.map((r) => ({
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
  }

  // ═══════════════════════════════════════════════════════════
  // 多文件 CSV 导入
  // ═══════════════════════════════════════════════════════════

  async importCsv(files: Array<{ originalname: string; buffer: Buffer }>, dedupMode?: 'overwrite' | 'ignore'): Promise<MultiImportResult> {
    const results: FileImportResult[] = [];

    // 预加载所有站点 code
    const sites = await this.siteRepo.find();
    const siteCodeSet = new Set(sites.map((s) => s.code));

    // 预加载现有记录的去重键（siteCode + liveDate）
    const existingRows = await this.repo.find({ select: ['siteCode', 'liveDate'] });
    const existingKeys = new Set(
      existingRows.map((r) => `${r.siteCode}|${r.liveDate}`),
    );

    for (const file of files) {
      const fileName = file.originalname;
      try {
        const fileResult = await this.processOneFile(file, siteCodeSet, existingKeys, dedupMode);
        results.push(fileResult);
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
  // 单文件处理（事务：全成功才入库）
  // ═══════════════════════════════════════════════════════════

  private async processOneFile(
    file: { originalname: string; buffer: Buffer },
    siteCodeSet: Set<string>,
    existingKeys: Set<string>,
    dedupMode?: 'overwrite' | 'ignore',
  ): Promise<FileImportResult> {
    const fileName = file.originalname;

    // 解析文件名: {code}-{date}.csv
    const nameWithoutExt = fileName.replace(/\.(csv|xlsx)$/i, '');
    const m = nameWithoutExt.match(/^([a-zA-Z0-9_-]+?)-(\d{4}-\d{1,2}-\d{1,2})$/);
    const mChinese = nameWithoutExt.match(/^([a-zA-Z0-9_-]+?)-(\d{4})年(\d{1,2})月(\d{1,2})号?$/);

    let siteCode: string;
    let liveDate: string;

    if (m) {
      siteCode = m[1];
      liveDate = m[2].replace(/\./g, '-');
    } else if (mChinese) {
      siteCode = mChinese[1];
      liveDate = `${mChinese[2]}-${mChinese[3].padStart(2, '0')}-${mChinese[4].padStart(2, '0')}`;
    } else {
      // 再尝试宽松匹配
      const looseM = nameWithoutExt.match(/^([a-zA-Z0-9_-]+?)-(.+)/);
      if (looseM) {
        siteCode = looseM[1];
        const datePart = looseM[2];
        // 尝试用 dayjs 类解析
        const parsedDate = this.parseDateString(datePart);
        if (parsedDate) {
          liveDate = parsedDate;
        } else {
          return { fileName, success: 0, failed: 1, error: `文件名格式不匹配: 期望 {code}-{date}.csv` };
        }
      } else {
        return { fileName, success: 0, failed: 1, error: `文件名格式不匹配: 期望 {code}-{date}.csv` };
      }
    }

    // 验证 site_code 存在
    if (!siteCodeSet.has(siteCode)) {
      return { fileName, success: 0, failed: 1, error: `站点 code "${siteCode}" 在 live_site 表中不存在` };
    }

    // 解析文件内容（支持 CSV 和 XLSX）
    const isXlsx = /\.xlsx$/i.test(fileName);
    let lines: string[];

    if (isXlsx) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return { fileName, success: 0, failed: 1, error: 'XLSX 文件中无工作表' };
      }
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_csv(sheet).split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);
      lines = rows;
    } else {
      const content = file.buffer.toString('utf-8').trim();
      if (!content) {
        return { fileName, success: 0, failed: 1, error: 'CSV 文件为空' };
      }
      lines = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    }

    if (!lines || lines.length === 0) {
      return { fileName, success: 0, failed: 1, error: '文件内容为空' };
    }

    // 第 1 行: 表头（跳过），第 2 行起: 数据
    const dataLines = lines.slice(1);
    const entities: LiveStreamData[] = [];
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < dataLines.length; i++) {
      try {
        const cols = this.parseCsvLine(dataLines[i]);

        // CSV 共 10 列: room_id, live_info, category, host, start_time, duration, comment_count, avg_stay_visit, avg_stay_person, peak_online
        if (cols.length < 10) {
          errors.push(`第 ${i + 2} 行: 列数不足 (需要 10 列，实际 ${cols.length} 列)`);
          failed++;
          continue;
        }

        // 1. room_id (cols[0])
        const roomId = cols[0]?.trim();
        if (!roomId) {
          errors.push(`第 ${i + 2} 行: room_id 为空`);
          failed++;
          continue;
        }

        // 5. start_time (cols[4])
        const startTimeStr = cols[4]?.trim();
        if (!startTimeStr) {
          errors.push(`第 ${i + 2} 行: start_time 为空`);
          failed++;
          continue;
        }
        const startTime = new Date(startTimeStr.replace(' ', 'T'));
        if (isNaN(startTime.getTime())) {
          errors.push(`第 ${i + 2} 行: 无法解析开播时间 "${startTimeStr}"`);
          failed++;
          continue;
        }

        // 2. live_info → 拆分为 event_time, league, event_name
        const rawLiveInfo = cols[1]?.trim() || '';
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
              // 只有一个空格，全作为事件名
              eventName = afterFirst.trim() || null;
            }
          } else {
            eventName = rawLiveInfo;
          }
        }

        // 3. category (cols[2])
        const category = cols[2]?.trim() || null;

        // 4. host (cols[3])
        const host = cols[3]?.trim() || null;

        // 6. duration (cols[5]) — "2小时11分3秒" → 秒
        let duration: number | null = null;
        const durStr = cols[5]?.trim();
        if (durStr) {
          duration = this.parseDuration(durStr);
        }

        // 7. comment_count (cols[6])
        let commentCount = 0;
        const ccStr = cols[6]?.trim();
        if (ccStr) {
          const n = parseInt(ccStr.replace(/,/g, ''), 10);
          if (!isNaN(n)) commentCount = n;
        }

        // 8. avg_stay_visit (cols[7]) — "3分22秒" → 秒
        let avgStayVisit: number | null = null;
        const asvStr = cols[7]?.trim();
        if (asvStr) {
          avgStayVisit = this.parseDuration(asvStr);
        }

        // 9. avg_stay_person (cols[8]) — "2分33秒" → 秒
        let avgStayPerson: number | null = null;
        const aspStr = cols[8]?.trim();
        if (aspStr) {
          avgStayPerson = this.parseDuration(aspStr);
        }

        // 10. peak_online (cols[9])
        let peakOnline: number | null = null;
        const poStr = cols[9]?.trim();
        if (poStr) {
          const n = parseInt(poStr.replace(/,/g, ''), 10);
          if (!isNaN(n)) peakOnline = n;
        }

        entities.push(
          this.repo.create({
            siteCode,
            liveDate,
            roomId,
            liveInfo: rawLiveInfo || null,
            eventTime,
            league,
            eventName,
            eventId: null,
            category,
            host,
            startTime,
            duration,
            commentCount,
            avgStayVisit,
            avgStayPerson,
            peakOnline,
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
        return {
          fileName,
          success: entities.length,
          failed: 0,
          duplicates: entities.length,
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

    return { fileName, success, failed: 0 };
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
