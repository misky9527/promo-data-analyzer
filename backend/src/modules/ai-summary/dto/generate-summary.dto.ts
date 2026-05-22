import {
  IsIn,
  IsDateString,
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { ThinkingLevel } from '../providers/ai-provider.interface';
import { Transform, Type } from 'class-transformer';
import { AnalysisType } from '../../../common/constants/business.constants';

export class GenerateSummaryDto {
  @IsIn([
    AnalysisType.SINGLE_PERIOD,
    AnalysisType.DUAL_PERIOD,
    AnalysisType.MULTI_CHANNEL,
  ])
  type: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsDateString()
  compareStartDate?: string;

  @IsOptional()
  @IsDateString()
  compareEndDate?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) return value.map(Number);
    return String(value).split(',').filter(Boolean).map(Number);
  })
  @IsArray()
  @IsNumber({}, { each: true })
  channelIds?: number[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) return value.map(Number);
    return String(value).split(',').filter(Boolean).map(Number);
  })
  @IsArray()
  @IsNumber({}, { each: true })
  productIds?: number[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) return value.map(Number);
    return String(value).split(',').filter(Boolean).map(Number);
  })
  @IsArray()
  @IsNumber({}, { each: true })
  regionIds?: number[];

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  modelConfigId?: number;

  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsIn(['off', 'low', 'high'])
  thinkingLevel?: ThinkingLevel;

  @IsOptional()
  @IsIn(['full', 'brief'])
  outputStyle?: 'full' | 'brief';
}
