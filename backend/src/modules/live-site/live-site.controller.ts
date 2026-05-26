import { Controller, Get, Post, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { LiveSiteService } from './live-site.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/live-site')
@Roles('super_admin')
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
