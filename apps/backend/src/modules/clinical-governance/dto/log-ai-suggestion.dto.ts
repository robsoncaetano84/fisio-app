import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class LogAiSuggestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  stage: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  suggestionType: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['BAIXA', 'MODERADA', 'ALTA'])
  confidence: 'BAIXA' | 'MODERADA' | 'ALTA';

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  evidenceFields?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(120)
  patientId?: string;
}

