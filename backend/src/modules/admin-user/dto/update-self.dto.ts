import { IsString, IsOptional } from 'class-validator';

export class UpdateSelfDto {
  @IsOptional()
  @IsString()
  username?: string;
}
