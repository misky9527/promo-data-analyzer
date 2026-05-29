import { Controller, Post, Body, Req } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { OpsService } from './ops.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/constants/business.constants';

class ExecuteSqlDto {
  @IsString()
  @IsNotEmpty({ message: 'SQL 语句不能为空' })
  sql: string;
}

@Controller('admin/ops')
@Roles(RoleType.SUPER_ADMIN)
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

  @Post('execute')
  execute(@Body() dto: ExecuteSqlDto, @Req() req?: any): Promise<{ columns: string[]; rows: any[] }> {
    const operator = req?.user?.username ?? 'system';
    return this.opsService.execute(dto.sql, operator);
  }
}
