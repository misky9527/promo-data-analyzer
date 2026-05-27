import { IsOptional, IsEnum, IsArray } from 'class-validator';
import { RoleType, UserPermission } from '../../../common/constants/business.constants';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsEnum(RoleType)
  roleType?: RoleType;

  @IsOptional()
  status?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(UserPermission, { each: true })
  permissions?: string[];
}
