import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';
import { DictStatus } from '../../../common/constants/business.constants';

export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsIn([DictStatus.ACTIVE, DictStatus.INACTIVE])
  status?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
