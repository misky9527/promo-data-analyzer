import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe,
} from '@nestjs/common';
import { StreamerService } from './streamer.service';
import { CreateStreamerDto } from './dto/create-streamer.dto';
import { UpdateStreamerDto } from './dto/update-streamer.dto';
import { QueryStreamerDto } from './dto/query-streamer.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/constants/business.constants';
import { RequiredPermission } from '../../common/decorators/required-permission.decorator';
import { PERMISSION_MENUS } from '../../common/constants/permission.constants';

@Controller('admin/streamer')
@Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
@RequiredPermission(PERMISSION_MENUS.monitor.key)
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
