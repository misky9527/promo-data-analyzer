import { Controller, Get, Post, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { LiveSiteService } from './live-site.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/constants/business.constants';
import { RequiredPermission } from '../../common/decorators/required-permission.decorator';
import { PERMISSION_MENUS } from '../../common/constants/permission.constants';

@Controller('admin/live-site')
@Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
@RequiredPermission(PERMISSION_MENUS.monitor.key)
export class LiveSiteController {
  constructor(private readonly liveSiteService: LiveSiteService) {}

  @Get('list')
  list() {
    return this.liveSiteService.list();
  }

  @Post()
  create(@Body() body: { code: string; name: string }) {
    return this.liveSiteService.create(body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.liveSiteService.remove(id);
  }
}
