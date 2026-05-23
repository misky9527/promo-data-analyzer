import { IsString, IsOptional, MaxLength, IsNotEmpty, IsInt, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  appId: string;

  /** 查询地区（ISO 国家码，如 US/CN），用于调 Apple API */
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  defaultCountry: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  appName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bundleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  startDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  siteId?: number;

  // ─── 关联 ───

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  channelIds?: number[];

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  regionIds?: number[];
}
