import { IsString, IsOptional, MaxLength, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStreamerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

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
