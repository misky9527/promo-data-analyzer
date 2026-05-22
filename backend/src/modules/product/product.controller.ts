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

@Controller('products')
@Roles('super_admin')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /** 列表 */
  @Get()
  list(@Query() query: QueryProductDto) {
    return this.productService.list(query);
  }

  /** Apple API 预查询（不保存，供前端预览） */
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

  /** 详情 */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  /** 创建 */
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  /** 编辑 */
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  /** 删除（软删除） */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}
