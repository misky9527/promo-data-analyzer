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
import { ImportMode, RoleType } from '../../common/constants/business.constants';
import { RequiredPermission } from '../../common/decorators/required-permission.decorator';
import { PERMISSION_MENUS } from '../../common/constants/permission.constants';

@Controller('data-entries')
@Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
@RequiredPermission(PERMISSION_MENUS.core.key)
export class DataEntryController {
  constructor(private readonly entryService: DataEntryService) {}

  @Get()
  list(@Query() query: QueryEntryDto) {
    return this.entryService.list(query);
  }

  @Get('template')
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.entryService.generateTemplate();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="data-entry-template.xlsx"',
    });
    res.send(buffer);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.entryService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateEntryDto) {
    return this.entryService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEntryDto) {
    return this.entryService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.entryService.remove(id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  import(
    @UploadedFile() file: Express.Multer.File,
    @Query('mode') mode: ImportMode = ImportMode.APPEND,
    @Query('productId') productId?: number,
  ) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }
    if (![ImportMode.APPEND, ImportMode.OVERWRITE].includes(mode)) {
      throw new BadRequestException('mode 参数必须为 append 或 overwrite');
    }
    return this.entryService.importExcel(file.buffer, mode, productId);
  }
}
