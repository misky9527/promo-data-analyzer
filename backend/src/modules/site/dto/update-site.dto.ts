import { IsString, IsOptional, MaxLength, IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSiteDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  productIds?: number[];
}
