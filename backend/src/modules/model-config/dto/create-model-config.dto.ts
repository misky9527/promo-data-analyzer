import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateModelConfigDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsIn(['deepseek', 'openai'])
  provider: 'deepseek' | 'openai';

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  baseUrl?: string;

  @IsString()
  @MaxLength(100)
  modelVersion: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
