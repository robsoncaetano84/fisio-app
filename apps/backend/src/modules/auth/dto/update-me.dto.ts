import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  conselhoSigla?: string;

  @IsOptional()
  @Matches(/^[A-Z0-9][A-Z0-9/\-\s]{0,29}$/i, {
    message: 'Regiao/UF do conselho invalida',
  })
  conselhoUf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  registroProf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  especialidade?: string;

  @IsOptional()
  @IsBoolean()
  consentResearchOptional?: boolean;

  @IsOptional()
  @IsBoolean()
  consentAiOptional?: boolean;
}
