import {
  IsISO8601,
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsPositive,
  Min,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEntryDto {
  @IsISO8601()
  @IsNotEmpty()
  date: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  channelId: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  appId: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  regionId: number;

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
  @IsString()
  @MaxLength(500)
  remark?: string;
}
