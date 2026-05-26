import { IsString, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { RoleType } from '../../../common/constants/business.constants';

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
}
