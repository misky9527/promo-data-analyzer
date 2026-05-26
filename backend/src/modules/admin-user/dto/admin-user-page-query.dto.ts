import { IsOptional, IsInt, Min, IsString, MaxLength, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleType } from '../../../common/constants/business.constants';

export class AdminUserPageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  username?: string;

  @IsOptional()
  @IsEnum(RoleType)
  roleType?: RoleType;
}
