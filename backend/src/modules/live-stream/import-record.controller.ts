import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ImportRecordService } from './import-record.service';
import { QueryImportRecordDto } from './dto/query-import-record.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/constants/business.constants';
import { RequiredPermission } from '../../common/decorators/required-permission.decorator';
import { PERMISSION_MENUS } from '../../common/constants/permission.constants';

@Controller('admin/import-record')
@Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
@RequiredPermission(PERMISSION_MENUS.monitor.key)
export class ImportRecordController {
  constructor(private readonly importRecordService: ImportRecordService) {}

  @Get()
  list(@Query() query: QueryImportRecordDto) {
    return this.importRecordService.list(query.page, query.pageSize, query.deleted);
  }

  /** 清空回收站（仅超级管理员）— 必须在 :id 之前 */
  @Delete('recycle-bin')
  @Roles(RoleType.SUPER_ADMIN)
  emptyRecycleBin(@Req() req?: any) {
    const operator = req?.user?.username ?? 'system';
    return this.importRecordService.emptyRecycleBin(operator);
  }

  /** 彻底删除单条 */
  @Delete(':id/permanent')
  hardDelete(@Param('id', ParseIntPipe) id: number, @Req() req?: any) {
    const operator = req?.user?.username ?? 'system';
    return this.importRecordService.hardDelete(id, operator);
  }

  /** 软删除：移入回收站 */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req?: any) {
    const operator = req?.user?.username ?? 'system';
    return this.importRecordService.delete(id, operator);
  }

  /** 还原：从回收站恢复 */
  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number, @Req() req?: any) {
    const operator = req?.user?.username ?? 'system';
    return this.importRecordService.restore(id, operator);
  }
}
