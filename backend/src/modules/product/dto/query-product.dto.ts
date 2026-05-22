import { IsOptional, IsInt, Min, IsString, MaxLength, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { DictStatus } from '../../../common/constants/business.constants';

export class QueryProductDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([DictStatus.ACTIVE, DictStatus.INACTIVE])
  status?: number;
}
