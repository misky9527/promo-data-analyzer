import { IsOptional, IsString } from 'class-validator';

export class QueryEventHostSummaryDto {
  @IsOptional()
  @IsString()
  eventName?: string;

  @IsOptional()
  @IsString()
  host?: string;
}
