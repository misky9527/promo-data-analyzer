import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe, Req,
} from '@nestjs/common';
import { AdminUserService } from './admin-user.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { AdminUserPageQueryDto } from './dto/admin-user-page-query.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { UpdateSelfDto } from './dto/update-self.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/constants/business.constants';

@Controller('admin/admin-user')
@Roles(RoleType.SUPER_ADMIN)
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get('list')
  list(@Query() query: AdminUserPageQueryDto) {
    return this.adminUserService.list(query);
  }

  @Post()
  create(@Body() dto: CreateAdminUserDto) {
    return this.adminUserService.create(dto);
  }

  // 精确路由必须放在 :id 动态路由之前，否则会被 ParseIntPipe 拦截
  @Put('self')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  updateSelf(@Req() req: any, @Body() dto: UpdateSelfDto) {
    return this.adminUserService.updateSelf(req.user.id, dto);
  }

  @Post('change-password')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.adminUserService.changePassword(req.user.id, dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdminUserDto, @Req() req: any) {
    return this.adminUserService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.adminUserService.delete(id, req.user?.id);
  }

  @Post(':id/reset-password')
  resetPassword(@Param('id', ParseIntPipe) id: number) {
    return this.adminUserService.resetPassword(id);
  }

  @Post(':id/change-password')
  setPassword(@Param('id', ParseIntPipe) id: number, @Body() dto: SetPasswordDto) {
    return this.adminUserService.setPassword(id, dto);
  }
}
