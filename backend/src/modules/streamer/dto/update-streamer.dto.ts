import { IsString, IsOptional, MaxLength, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStreamerDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  siteId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  baseSalary?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
