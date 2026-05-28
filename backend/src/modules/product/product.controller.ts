import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/constants/business.constants';
import { RequiredPermission } from '../../common/decorators/required-permission.decorator';
import { PERMISSION_MENUS } from '../../common/constants/permission.constants';

@Controller('products')
@Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
@RequiredPermission(PERMISSION_MENUS.core.key)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  list(@Query() query: QueryProductDto) {
    return this.productService.list(query);
  }

  @Get('apple-lookup')
  async lookupApple(
    @Query('appId') appId: string,
    @Query('country') country: string,
  ) {
    if (!appId || !country) {
      throw new Error('appId and country required');
    }
    const info = await this.productService.previewAppleApp(appId, country);
    if (!info) {
      throw new BadRequestException('查询无结果，请确认 App ID 和地区是否正确，或尝试切换地区后重试');
    }
    return info;
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}
