import { IsOptional, IsEnum } from 'class-validator';
import { RoleType } from '../../../common/constants/business.constants';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsEnum(RoleType)
  roleType?: RoleType;

  @IsOptional()
  status?: number;
}
