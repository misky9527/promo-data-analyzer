import { Controller, Get, Post, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { LiveSiteService } from './live-site.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/live-site')
export class LiveSiteController {
  constructor(private readonly liveSiteService: LiveSiteService) {}

  @Get('list')
  list() {
    return this.liveSiteService.list();
  }

  @Post()
  @Roles('super_admin')
  create(@Body() body: { code: string; name: string }) {
    return this.liveSiteService.create(body);
  }

  @Delete(':id')
  @Roles('super_admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.liveSiteService.remove(id);
  }
}
