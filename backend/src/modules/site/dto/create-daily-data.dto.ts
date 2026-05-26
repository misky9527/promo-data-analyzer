import { IsString, IsNotEmpty, IsInt, IsNumber, IsOptional } from 'class-validator';

export class CreateDailyDataDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsInt()
  siteId: number;

  @IsOptional() @IsInt() registrations?: number;
  @IsOptional() @IsInt() payingUsers?: number;
  @IsOptional() @IsInt() firstChargeUsers?: number;
  @IsOptional() @IsNumber() entertainmentRevenue?: number;
  @IsOptional() @IsInt() entertainmentUsers?: number;
  @IsOptional() @IsNumber() rechargeGold?: number;
  @IsOptional() @IsNumber() exchangeAmount?: number;
  @IsOptional() @IsInt() exchangeUsers?: number;
  @IsOptional() @IsInt() retentionD1?: number;
  @IsOptional() @IsInt() retentionD7?: number;
  @IsOptional() @IsInt() retentionD30?: number;
}
