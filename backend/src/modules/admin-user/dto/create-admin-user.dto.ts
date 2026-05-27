import { IsString, MaxLength, IsEnum, IsOptional, IsArray } from 'class-validator';
import { RoleType, UserPermission } from '../../../common/constants/business.constants';

export class CreateAdminUserDto {
  @IsString()
  @MaxLength(64)
  username: string;

  @IsString()
  @MaxLength(128)
  password: string;

  @IsEnum(RoleType)
  roleType: RoleType;

  @IsOptional()
  status?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(UserPermission, { each: true })
  permissions?: string[];
}
