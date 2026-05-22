import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';
import { DictStatus } from '../../../common/constants/business.constants';

export class UpdateAppDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(['iOS', 'Android'])
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  packageName?: string;

  @IsOptional()
  @IsIn([DictStatus.ACTIVE, DictStatus.INACTIVE])
  status?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
