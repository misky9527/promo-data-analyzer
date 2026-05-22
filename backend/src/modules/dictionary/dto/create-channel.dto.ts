import { IsString, IsOptional, MaxLength, IsIn, IsNotEmpty } from 'class-validator';
import { DictStatus } from '../../../common/constants/business.constants';

export class CreateChannelDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsOptional()
  @IsIn([DictStatus.ACTIVE, DictStatus.INACTIVE])
  status?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
