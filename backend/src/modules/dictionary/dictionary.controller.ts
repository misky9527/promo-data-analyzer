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

@Controller('dict')
@Roles('super_admin')
export class DictionaryController {
  constructor(private readonly dictService: DictionaryService) {}

  // ─── 渠道 ───

  @Get('channel')
  listChannels(@Query() query: QueryDictDto) {
    return this.dictService.listChannels(query);
  }

  @Post('channel')
  createChannel(@Body() dto: CreateChannelDto) {
    return this.dictService.createChannel(dto);
  }

  @Patch('channel/:id')
  updateChannel(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateChannelDto) {
    return this.dictService.updateChannel(id, dto);
  }

  @Post('channel/:id/disable')
  disableChannel(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.disableChannel(id);
  }

  @Post('channel/:id/enable')
  enableChannel(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.enableChannel(id);
  }

  @Delete('channel/:id')
  deleteChannel(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.deleteChannel(id);
  }

  @Post('channel/:id/restore')
  restoreChannel(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.restoreChannel(id);
  }

  @Delete('channel/:id/permanent')
  permanentDeleteChannel(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.permanentDeleteChannel(id);
  }

  @Get('channel/recycle')
  recycleChannels(@Query() query: QueryDictDto) {
    return this.dictService.recycleChannels(query);
  }

  // ─── 地区 ───

  @Get('region')
  listRegions(@Query() query: QueryDictDto) {
    return this.dictService.listRegions(query);
  }

  @Post('region')
  createRegion(@Body() dto: CreateRegionDto) {
    return this.dictService.createRegion(dto);
  }

  @Patch('region/:id')
  updateRegion(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRegionDto) {
    return this.dictService.updateRegion(id, dto);
  }

  @Post('region/:id/disable')
  disableRegion(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.disableRegion(id);
  }

  @Post('region/:id/enable')
  enableRegion(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.enableRegion(id);
  }

  @Delete('region/:id')
  deleteRegion(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.deleteRegion(id);
  }

  @Post('region/:id/restore')
  restoreRegion(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.restoreRegion(id);
  }

  @Delete('region/:id/permanent')
  permanentDeleteRegion(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.permanentDeleteRegion(id);
  }

  @Get('region/recycle')
  recycleRegions(@Query() query: QueryDictDto) {
    return this.dictService.recycleRegions(query);
  }
}
