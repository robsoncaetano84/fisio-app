import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

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
  @Matches(/^[A-Z]{2}$/, { message: 'UF do conselho invalida' })
  conselhoUf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  registroProf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  especialidade?: string;
}
