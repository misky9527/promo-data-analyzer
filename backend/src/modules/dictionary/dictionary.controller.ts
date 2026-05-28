import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe,
} from '@nestjs/common';
import { DictionaryService } from './dictionary.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { QueryDictDto } from './dto/query-dict.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/constants/business.constants';
import { RequiredPermission } from '../../common/decorators/required-permission.decorator';
import { PERMISSION_MENUS } from '../../common/constants/permission.constants';

@Controller('dict')
@Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
export class DictionaryController {
  constructor(private readonly dictService: DictionaryService) {}

  @Get('channel')
  @RequiredPermission(PERMISSION_MENUS.dict.children[0].key)
  listChannels(@Query() query: QueryDictDto) {
    return this.dictService.listChannels(query);
  }

  @Post('channel')
  @RequiredPermission(PERMISSION_MENUS.dict.children[0].key)
  createChannel(@Body() dto: CreateChannelDto) {
    return this.dictService.createChannel(dto);
  }

  @Patch('channel/:id')
  @RequiredPermission(PERMISSION_MENUS.dict.children[0].key)
  updateChannel(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateChannelDto) {
    return this.dictService.updateChannel(id, dto);
  }

  @Post('channel/:id/disable')
  @RequiredPermission(PERMISSION_MENUS.dict.children[0].key)
  disableChannel(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.disableChannel(id);
  }

  @Post('channel/:id/enable')
  @RequiredPermission(PERMISSION_MENUS.dict.children[0].key)
  enableChannel(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.enableChannel(id);
  }

  @Delete('channel/:id')
  @RequiredPermission(PERMISSION_MENUS.dict.children[0].key)
  deleteChannel(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.deleteChannel(id);
  }

  @Post('channel/:id/restore')
  @RequiredPermission(PERMISSION_MENUS.dict.children[0].key)
  restoreChannel(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.restoreChannel(id);
  }

  @Delete('channel/:id/permanent')
  @RequiredPermission(PERMISSION_MENUS.dict.children[0].key)
  permanentDeleteChannel(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.permanentDeleteChannel(id);
  }

  @Get('channel/recycle')
  @RequiredPermission(PERMISSION_MENUS.dict.children[0].key)
  recycleChannels(@Query() query: QueryDictDto) {
    return this.dictService.recycleChannels(query);
  }

  @Get('region')
  @RequiredPermission(PERMISSION_MENUS.dict.children[1].key)
  listRegions(@Query() query: QueryDictDto) {
    return this.dictService.listRegions(query);
  }

  @Post('region')
  @RequiredPermission(PERMISSION_MENUS.dict.children[1].key)
  createRegion(@Body() dto: CreateRegionDto) {
    return this.dictService.createRegion(dto);
  }

  @Patch('region/:id')
  @RequiredPermission(PERMISSION_MENUS.dict.children[1].key)
  updateRegion(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRegionDto) {
    return this.dictService.updateRegion(id, dto);
  }

  @Post('region/:id/disable')
  @RequiredPermission(PERMISSION_MENUS.dict.children[1].key)
  disableRegion(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.disableRegion(id);
  }

  @Post('region/:id/enable')
  @RequiredPermission(PERMISSION_MENUS.dict.children[1].key)
  enableRegion(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.enableRegion(id);
  }

  @Delete('region/:id')
  @RequiredPermission(PERMISSION_MENUS.dict.children[1].key)
  deleteRegion(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.deleteRegion(id);
  }

  @Post('region/:id/restore')
  @RequiredPermission(PERMISSION_MENUS.dict.children[1].key)
  restoreRegion(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.restoreRegion(id);
  }

  @Delete('region/:id/permanent')
  @RequiredPermission(PERMISSION_MENUS.dict.children[1].key)
  permanentDeleteRegion(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.permanentDeleteRegion(id);
  }

  @Get('region/recycle')
  @RequiredPermission(PERMISSION_MENUS.dict.children[1].key)
  recycleRegions(@Query() query: QueryDictDto) {
    return this.dictService.recycleRegions(query);
  }
}
