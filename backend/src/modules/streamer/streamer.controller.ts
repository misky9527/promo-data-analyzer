import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe,
} from '@nestjs/common';
import { StreamerService } from './streamer.service';
import { CreateStreamerDto } from './dto/create-streamer.dto';
import { UpdateStreamerDto } from './dto/update-streamer.dto';
import { QueryStreamerDto } from './dto/query-streamer.dto';

@Controller('admin/streamer')
export class StreamerController {
  constructor(private readonly streamerService: StreamerService) {}

  @Get()
  list(@Query() query: QueryStreamerDto) {
    return this.streamerService.list(query);
  }

  @Post()
  create(@Body() dto: CreateStreamerDto) {
    return this.streamerService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStreamerDto) {
    return this.streamerService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.streamerService.delete(id);
  }
}
