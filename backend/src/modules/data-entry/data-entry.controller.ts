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
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DataEntryService } from './data-entry.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { QueryEntryDto } from './dto/query-entry.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { ImportMode } from '../../common/constants/business.constants';

@Controller('data-entries')
@Roles('super_admin')
export class DataEntryController {
  constructor(private readonly entryService: DataEntryService) {}

  /** 分页列表 */
  @Get()
  list(@Query() query: QueryEntryDto) {
    return this.entryService.list(query);
  }

  /** 下载 Excel 模板 */
  @Get('template')
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.entryService.generateTemplate();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="data-entry-template.xlsx"',
    });
    res.send(buffer);
  }

  /** 详情 */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.entryService.findOne(id);
  }

  /** 逐条录入 */
  @Post()
  create(@Body() dto: CreateEntryDto) {
    return this.entryService.create(dto);
  }

  /** 编辑 */
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEntryDto) {
    return this.entryService.update(id, dto);
  }

  /** 删除 */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.entryService.remove(id);
  }

  /** Excel 批量导入 */
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  import(
    @UploadedFile() file: Express.Multer.File,
    @Query('mode') mode: ImportMode = ImportMode.APPEND,
  ) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }
    if (![ImportMode.APPEND, ImportMode.OVERWRITE].includes(mode)) {
      throw new BadRequestException('mode 参数必须为 append 或 overwrite');
    }
    return this.entryService.importExcel(file.buffer, mode);
  }
}
