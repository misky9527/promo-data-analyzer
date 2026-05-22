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

  @Delete('channel/:id')
  deleteChannel(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.deleteChannel(id);
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

  @Delete('region/:id')
  deleteRegion(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.deleteRegion(id);
  }
}
