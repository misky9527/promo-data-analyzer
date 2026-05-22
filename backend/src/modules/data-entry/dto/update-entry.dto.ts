import {
  IsISO8601,
  IsOptional,
  IsInt,
  IsNumber,
  IsPositive,
  Min,
  Max,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/** 所有字段可选，用于编辑 */
export class UpdateEntryDto {
  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  channelId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  appId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  regionId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  impressions?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  clicks?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  downloads?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  spend?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  revenue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  chargeCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  registrations?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  payingUsers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  retentionD1?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  retentionD7?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  retentionD30?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
