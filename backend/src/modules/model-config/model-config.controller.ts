import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { ModelConfigService } from './model-config.service';
import { QueryModelConfigDto } from './dto/query-model-config.dto';
import { CreateModelConfigDto } from './dto/create-model-config.dto';
import { UpdateModelConfigDto } from './dto/update-model-config.dto';
import { FetchModelsDto } from './dto/fetch-models.dto';
import { RoleType } from '../../common/constants/business.constants';
import { RequiredPermission } from '../../common/decorators/required-permission.decorator';
import { PERMISSION_MENUS } from '../../common/constants/permission.constants';

@Controller('model-configs')
@Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
@RequiredPermission(PERMISSION_MENUS.ai.key)
export class ModelConfigController {
  constructor(private readonly modelConfigService: ModelConfigService) {}

  @Get()
  list(@Query() query: QueryModelConfigDto) {
    return this.modelConfigService.list(query);
  }

  @Get('active')
  getActive() {
    return this.modelConfigService.getActive();
  }

  @Post('fetch-models')
  fetchModels(@Body() dto: FetchModelsDto) {
    return this.modelConfigService.fetchModels(dto);
  }

  @Post()
  create(@Body() dto: CreateModelConfigDto) {
    return this.modelConfigService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateModelConfigDto) {
    return this.modelConfigService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.modelConfigService.remove(id);
  }
}
