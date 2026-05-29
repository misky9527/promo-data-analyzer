import { Injectable, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { LogService } from '../log/log.service';

const FORBIDDEN_KEYWORDS = ['DROP', 'TRUNCATE', 'ALTER', 'CREATE'];
const ALLOWED_KEYWORDS = ['SELECT', 'EXPLAIN', 'SHOW', 'DESCRIBE', 'DESC', 'WITH', 'INSERT', 'UPDATE', 'DELETE'];
const SQL_TIMEOUT_MS = 30_000;

@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly logService: LogService,
  ) {}

  async execute(sql: string, operator: string = 'system'): Promise<{ columns: string[]; rows: any[] }> {
    const trimmed = (sql ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('SQL 语句不能为空');
    }

    const firstWord = trimmed.split(/\s+/)[0].toUpperCase();

    if (FORBIDDEN_KEYWORDS.includes(firstWord)) {
      throw new ForbiddenException(`禁止执行 ${firstWord} 语句，仅允许 SELECT / EXPLAIN 等查询操作`);
    }

    if (!ALLOWED_KEYWORDS.includes(firstWord)) {
      throw new ForbiddenException(`不允许的 SQL 类型: ${firstWord}，仅支持 SELECT / EXPLAIN / SHOW / DESCRIBE / WITH / INSERT / UPDATE / DELETE`);
    }

    // DELETE 必须带 WHERE 条件，防止误清全表
    if (firstWord === 'DELETE') {
      const upperSql = trimmed.toUpperCase();
      if (!/\bWHERE\b/.test(upperSql)) {
        throw new ForbiddenException('DELETE 语句必须包含 WHERE 条件，不允许清空整表');
      }
    }

    this.logger.log(`执行 SQL: ${trimmed.substring(0, 200)}`);

    // 写入操作日志
    const logDescription = `执行 SQL: ${trimmed.length > 200 ? trimmed.substring(0, 200) + '...' : trimmed}`;

    try {
      const result = await this.executeWithTimeout(trimmed);
      const columns = Array.isArray(result) && result.length > 0
        ? Object.keys(result[0])
        : [];
      const rowCount = Array.isArray(result) ? result.length : 0;

      // 异步写日志，不阻塞返回
      this.logService.create({
        operationType: 'sql',
        description: logDescription,
        operator,
        recordCount: rowCount,
      }).catch((err: any) => this.logger.error(`SQL 日志写入失败: ${err.message}`));

      return { columns, rows: result ?? [] };
    } catch (error: any) {
      // 执行失败也记录日志
      this.logService.create({
        operationType: 'sql',
        description: `${logDescription} (执行失败: ${error?.message ?? error})`,
        operator,
      }).catch((err: any) => this.logger.error(`SQL 日志写入失败: ${err.message}`));

      this.logger.error(`SQL 执行失败: ${error?.message ?? error}`);
      throw new BadRequestException(error?.message ?? 'SQL 执行失败');
    }
  }

  private async executeWithTimeout(sql: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`查询超时（${SQL_TIMEOUT_MS / 1000}秒）`));
      }, SQL_TIMEOUT_MS);

      this.dataSource.query(sql)
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}
