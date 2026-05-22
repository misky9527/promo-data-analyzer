import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class FetchModelsDto {
  @IsIn(['deepseek', 'openai'])
  provider: 'deepseek' | 'openai';

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  baseUrl?: string;
}
