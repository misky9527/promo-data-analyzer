import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { OperationLog } from './operation-log.entity';

export interface CreateLogDto {
  operationType: string;
  description?: string;
  operator: string;
  targetTable?: string;
  recordCount?: number;
}

@Injectable()
export class LogService {
  private readonly logger = new Logger(LogService.name);

  constructor(
    @InjectRepository(OperationLog)
    private readonly repo: Repository<OperationLog>,
  ) {}

  async list(
    page: number = 1,
    pageSize: number = 10,
    operationType?: string,
  ) {
    const where: FindOptionsWhere<OperationLog> = {};
    if (operationType) {
      where.operationType = operationType;
    }

    const [list, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total, page, pageSize };
  }

  async create(data: CreateLogDto): Promise<OperationLog> {
    try {
      const record = this.repo.create(data);
      return await this.repo.save(record);
    } catch (err: any) {
      this.logger.error(`写入操作日志失败: ${err.message}`);
      // 不抛异常，避免影响业务主流程
      return null as any;
    }
  }

  async getRecent(limit: number = 10): Promise<OperationLog[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
