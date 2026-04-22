import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCrmAdminProfessionalDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nome?: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail invalido' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  especialidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  registroProf?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

