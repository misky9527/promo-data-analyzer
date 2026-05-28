import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseInterceptors, UploadedFile, Res, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { SiteService } from './site.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { QuerySiteDto } from './dto/query-site.dto';
import { CreateDailyDataDto } from './dto/create-daily-data.dto';
import { QueryDailyDataDto } from './dto/query-daily-data.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/constants/business.constants';
import { RequiredPermission } from '../../common/decorators/required-permission.decorator';
import { PERMISSION_MENUS } from '../../common/constants/permission.constants';

@Controller('sites')
@Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
@RequiredPermission(PERMISSION_MENUS.core.key)
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Get() list(@Query() q: QuerySiteDto) { return this.siteService.list(q); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.siteService.findOne(id); }
  @Post() create(@Body() dto: CreateSiteDto) { return this.siteService.create(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSiteDto) { return this.siteService.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.siteService.remove(id); }

  @Get('daily/template')
  async downloadTemplate(@Res() res: Response) {
    const buf = await this.siteService.generateDailyTemplate();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="site-daily-template.xlsx"',
    });
    res.send(buf);
  }
}

@Controller('site-daily-data')
@Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
@RequiredPermission(PERMISSION_MENUS.core.key)
export class SiteDailyDataController {
  constructor(private readonly siteService: SiteService) {}

  @Get() list(@Query() q: QueryDailyDataDto) { return this.siteService.listDailyData(q); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.siteService.findDailyData(id); }
  @Post() create(@Body() dto: CreateDailyDataDto) { return this.siteService.createDailyData(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateDailyDataDto) { return this.siteService.updateDailyData(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.siteService.removeDailyData(id); }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(
    @UploadedFile() file: Express.Multer.File,
    @Query('mode') mode: string,
    @Query('siteId') siteId: string,
  ) {
    if (!file) throw new BadRequestException('请上传文件');
    if (!siteId) throw new BadRequestException('请选择站点');
    const sid = Number(siteId);
    if (isNaN(sid)) throw new BadRequestException('无效的站点 ID');
    return this.siteService.importDailyExcel(file.buffer, mode || 'append', sid);
  }
}
