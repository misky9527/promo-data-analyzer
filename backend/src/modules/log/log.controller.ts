import { Controller, Get, Query } from '@nestjs/common';
import { LogService } from './log.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/constants/business.constants';

@Controller('admin/log')
@Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get()
  list(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('operationType') operationType?: string,
  ) {
    return this.logService.list(
      page ? +page : 1,
      pageSize ? +pageSize : 10,
      operationType,
    );
  }

  @Get('recent')
  getRecent() {
    return this.logService.getRecent(10);
  }
}
