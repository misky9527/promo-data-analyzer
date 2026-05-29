import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImportRecord } from './entities/import-record.entity';
import { LiveStreamData } from './entities/live-stream-data.entity';

@Injectable()
export class ImportRecordService {
  private readonly logger = new Logger(ImportRecordService.name);

  constructor(
    @InjectRepository(ImportRecord)
    private readonly repo: Repository<ImportRecord>,
    @InjectRepository(LiveStreamData)
    private readonly liveStreamRepo: Repository<LiveStreamData>,
  ) {}

  async list(page: number = 1, pageSize: number = 10, deleted: boolean = false) {
    if (deleted) {
      // 回收站：只显示已删除的记录
      const qb = this.repo
        .createQueryBuilder('ir')
        .withDeleted()
        .where('ir.deletedAt IS NOT NULL')
        .orderBy('ir.deletedAt', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize);
      const [list, total] = await qb.getManyAndCount();
      return { list, total, page, pageSize };
    }

    // 正常列表：@DeleteDateColumn() 自动过滤 deletedAt IS NULL
    const [list, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  async create(data: {
    fileName: string;
    siteCode: string;
    liveDate: string;
    recordCount: number;
    operator: string;
  }): Promise<ImportRecord> {
    const record = this.repo.create(data);
    return this.repo.save(record);
  }

  /** 软删除：将导入记录和对应的直播数据移入回收站 */
  async delete(id: number): Promise<void> {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('导入记录不存在');
    }

    // 软删除导入记录
    await this.repo.softDelete(id);

    // 软删除对应的直播数据（按 siteCode + liveDate 匹配）
    const updateResult = await this.liveStreamRepo
      .createQueryBuilder()
      .update(LiveStreamData)
      .set({ deletedAt: () => 'NOW()' })
      .where('siteCode = :siteCode', { siteCode: record.siteCode })
      .andWhere('liveDate = :liveDate', { liveDate: record.liveDate })
      .andWhere('deletedAt IS NULL')
      .execute();

    this.logger.log(
      `软删除导入记录 id=${id}，同时软删除 live_stream_data ${updateResult.affected ?? 0} 条 ` +
        `(siteCode=${record.siteCode}, liveDate=${record.liveDate})`,
    );
  }

  /** 还原：将导入记录和对应的直播数据从回收站恢复 */
  async restore(id: number): Promise<void> {
    const record = await this.repo.findOne({ where: { id }, withDeleted: true });
    if (!record) {
      throw new NotFoundException('导入记录不存在');
    }

    // 还原导入记录
    await this.repo.recover(record);

    // 还原对应的直播数据（按 siteCode + liveDate 匹配）
    const updateResult = await this.liveStreamRepo
      .createQueryBuilder()
      .update(LiveStreamData)
      .set({ deletedAt: null })
      .where('siteCode = :siteCode', { siteCode: record.siteCode })
      .andWhere('liveDate = :liveDate', { liveDate: record.liveDate })
      .andWhere('deletedAt IS NOT NULL')
      .execute();

    this.logger.log(
      `还原导入记录 id=${id}，同时还原 live_stream_data ${updateResult.affected ?? 0} 条 ` +
        `(siteCode=${record.siteCode}, liveDate=${record.liveDate})`,
    );
  }

  /** 清空回收站：物理删除所有已软删除的导入记录和直播数据 */
  async emptyRecycleBin(): Promise<{ importRecords: number; liveStreamData: number }> {
    // 物理删除已软删除的导入记录
    const importResult = await this.repo
      .createQueryBuilder()
      .delete()
      .where('deletedAt IS NOT NULL')
      .execute();

    // 物理删除已软删除的直播数据
    const liveResult = await this.liveStreamRepo
      .createQueryBuilder()
      .delete()
      .where('deletedAt IS NOT NULL')
      .execute();

    const importCount = importResult.affected ?? 0;
    const liveCount = liveResult.affected ?? 0;

    this.logger.log(
      `清空回收站：删除 import_record ${importCount} 条，live_stream_data ${liveCount} 条`,
    );

    return { importRecords: importCount, liveStreamData: liveCount };
  }
}
