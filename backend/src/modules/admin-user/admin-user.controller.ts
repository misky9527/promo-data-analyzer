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
import { RequiredPermission } from '../../common/decorators/required-permission.decorator';
import { PERMISSION_MENUS } from '../../common/constants/permission.constants';
import { RequestUser } from '../../common/interfaces/request-user.interface';

@Controller('admin/admin-user')
@Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get('list')
  @RequiredPermission(PERMISSION_MENUS.dict.children[2].key)
  list(@Query() query: AdminUserPageQueryDto) {
    return this.adminUserService.list(query);
  }

  @Post()
  @RequiredPermission(PERMISSION_MENUS.dict.children[2].key)
  create(@Body() dto: CreateAdminUserDto, @Req() req: { user: RequestUser }) {
    return this.adminUserService.create(dto, req.user);
  }

  @Put('self')
  updateSelf(@Req() req: { user: RequestUser }, @Body() dto: UpdateSelfDto) {
    return this.adminUserService.updateSelf(req.user.id, dto);
  }

  @Post('change-password')
  changePassword(@Req() req: { user: RequestUser }, @Body() dto: ChangePasswordDto) {
    return this.adminUserService.changePassword(req.user.id, dto);
  }

  @Put(':id')
  @RequiredPermission(PERMISSION_MENUS.dict.children[2].key)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdminUserDto, @Req() req: { user: RequestUser }) {
    return this.adminUserService.update(id, dto, req.user);
  }

  @Delete(':id')
  @RequiredPermission(PERMISSION_MENUS.dict.children[2].key)
  delete(@Param('id', ParseIntPipe) id: number, @Req() req: { user: RequestUser }) {
    return this.adminUserService.delete(id, req.user);
  }

  @Post(':id/reset-password')
  @RequiredPermission(PERMISSION_MENUS.dict.children[2].key)
  resetPassword(@Param('id', ParseIntPipe) id: number, @Req() req: { user: RequestUser }) {
    return this.adminUserService.resetPassword(id, req.user);
  }

  @Post(':id/change-password')
  @RequiredPermission(PERMISSION_MENUS.dict.children[2].key)
  setPassword(@Param('id', ParseIntPipe) id: number, @Body() dto: SetPasswordDto, @Req() req: { user: RequestUser }) {
    return this.adminUserService.setPassword(id, dto, req.user);
  }
}
