import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { LiveStreamService } from './live-stream.service';
import { QueryLiveDataDto } from './dto/query-live-data.dto';
import { QueryDailySummaryDto } from './dto/query-daily-summary.dto';
import { QueryEventSummaryDto } from './dto/query-event-summary.dto';
import { QueryHostSummaryDto } from './dto/query-host-summary.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/live-stream')
@Roles('super_admin')
export class LiveStreamController {
  constructor(private readonly liveStreamService: LiveStreamService) {}

  /** CSV 多文件导入 */
  @Post('import')
  @UseInterceptors(FilesInterceptor('files', 20))
  async import(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('dedupMode') dedupMode?: 'overwrite' | 'ignore',
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('请上传 CSV 文件');
    }
    for (const file of files) {
      const ext = file.originalname?.split('.').pop()?.toLowerCase();
      if (ext !== 'csv' && ext !== 'xlsx') {
        throw new BadRequestException(`文件 ${file.originalname} 不是 CSV 格式`);
      }
    }
    return this.liveStreamService.importCsv(
      files.map((f) => ({ originalname: f.originalname, buffer: f.buffer })),
      dedupMode,
    );
  }

  /** 分页列表 */
  @Get('list')
  list(@Query() query: QueryLiveDataDto) {
    return this.liveStreamService.list(query);
  }

  /** 删除单条 */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.liveStreamService.remove(id);
  }

  /** 每日汇总 */
  @Get('daily-summary')
  dailySummary(@Query() query: QueryDailySummaryDto) {
    return this.liveStreamService.dailySummary(query);
  }

  /** 赛事汇总 */
  @Get('event-summary')
  eventSummary(@Query() query: QueryEventSummaryDto) {
    return this.liveStreamService.eventSummary(query);
  }

  /** 同赛事主播汇总（查看明细） */
  @Get('host-summary')
  hostSummary(@Query() query: QueryHostSummaryDto) {
    return this.liveStreamService.hostSummary(query);
  }

  /** 批量删除 */
  @Post('batch-delete')
  batchRemove(@Body('ids') ids: number[]) {
    if (!ids || !ids.length) {
      throw new BadRequestException('请选择要删除的记录');
    }
    return this.liveStreamService.batchRemove(ids);
  }
}
