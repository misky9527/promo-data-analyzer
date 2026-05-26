import { IsString, IsNotEmpty } from 'class-validator';

export class QueryHostSummaryDto {
  @IsNotEmpty()
  @IsString()
  eventName: string;

  @IsNotEmpty()
  @IsString()
  liveDate: string;
}
