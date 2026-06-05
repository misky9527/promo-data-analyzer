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
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { LiveStreamService } from './live-stream.service';
import { QueryLiveDataDto } from './dto/query-live-data.dto';
import { QueryDailySummaryDto } from './dto/query-daily-summary.dto';
import { QueryEventSummaryDto } from './dto/query-event-summary.dto';
import { QueryHostSummaryDto } from './dto/query-host-summary.dto';
import { QueryEventHostSummaryDto } from './dto/query-event-host-summary.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/constants/business.constants';
import { RequiredPermission } from '../../common/decorators/required-permission.decorator';
import { PERMISSION_MENUS } from '../../common/constants/permission.constants';

@Controller('admin/live-stream')
@Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
@RequiredPermission(PERMISSION_MENUS.monitor.key)
export class LiveStreamController {
  constructor(private readonly liveStreamService: LiveStreamService) {}

  @Post('import')
  @UseInterceptors(FilesInterceptor('files', 20))
  async import(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('dedupMode') dedupMode?: 'overwrite' | 'ignore',
    @Req() req?: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('请上传 XLSX 文件');
    }
    for (const file of files) {
      const ext = file.originalname?.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx') {
        throw new BadRequestException(`文件 ${file.originalname} 不是 XLSX 格式`);
      }
    }
    const operator = req?.user?.username ?? 'system';
    return this.liveStreamService.importCsv(
      files.map((f) => ({ originalname: f.originalname, buffer: f.buffer })),
      dedupMode,
      operator,
    );
  }

  @Get('list')
  list(@Query() query: QueryLiveDataDto) {
    return this.liveStreamService.list(query);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.liveStreamService.remove(id);
  }

  @Get('daily-summary')
  dailySummary(@Query() query: QueryDailySummaryDto) {
    return this.liveStreamService.dailySummary(query);
  }

  @Get('event-summary')
  eventSummary(@Query() query: QueryEventSummaryDto) {
    return this.liveStreamService.eventSummary(query);
  }

  @Get('host-summary')
  hostSummary(@Query() query: QueryHostSummaryDto) {
    return this.liveStreamService.hostSummary(query);
  }

  @Get('event-host-summary')
  eventHostSummary(@Query() query: QueryEventHostSummaryDto) {
    return this.liveStreamService.eventHostSummary(query);
  }

  @Post('batch-delete')
  batchRemove(@Body('ids') ids: number[]) {
    if (!ids || !ids.length) {
      throw new BadRequestException('请选择要删除的记录');
    }
    return this.liveStreamService.batchRemove(ids);
  }
}
