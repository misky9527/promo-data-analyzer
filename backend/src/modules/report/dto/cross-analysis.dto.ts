import { IsOptional, IsDateString, IsString, IsArray, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { Type } from 'class-transformer';

const DIMENSIONS = ['channel', 'app', 'region'] as const;

export class CrossAnalysisDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsIn(DIMENSIONS)
  rowDimension: 'channel' | 'app' | 'region';

  @IsOptional()
  @IsIn(DIMENSIONS)
  colDimension?: 'channel' | 'app' | 'region';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',');
    return value;
  })
  metrics?: string[];

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  channelId?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  appId?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  regionId?: number;
}
