// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// C RE AT E U SU AR IO.D TO
// ==========================================
import {
  IsBoolean,
  Equals,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../entities/usuario.entity';

export class CreateUsuarioDto {
  @IsNotEmpty({ message: 'Nome e obrigatorio' })
  @IsString()
  nome: string;

  @IsNotEmpty({ message: 'E-mail e obrigatorio' })
  @IsEmail({}, { message: 'E-mail invalido' })
  email: string;

  @IsNotEmpty({ message: 'Senha e obrigatoria' })
  @MinLength(8, { message: 'Senha deve ter no minimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Senha deve conter letra maiuscula, minuscula e numero',
  })
  senha: string;

  @ValidateIf((o) => o.role !== UserRole.PACIENTE)
  @IsNotEmpty({ message: 'Conselho profissional e obrigatorio' })
  @IsString()
  conselhoSigla?: string;

  @ValidateIf((o) => o.role !== UserRole.PACIENTE)
  @IsNotEmpty({ message: 'UF do conselho e obrigatoria' })
  @Matches(/^[A-Z]{2}$/, { message: 'UF do conselho invalida' })
  conselhoUf?: string;

  @IsOptional()
  @IsString()
  conselhoProf?: string;

  @ValidateIf((o) => o.role !== UserRole.PACIENTE)
  @IsNotEmpty({ message: 'Registro profissional e obrigatorio' })
  @IsString()
  registroProf?: string;

  @IsOptional()
  @IsString()
  especialidade?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ValidateIf((o) => o.role === UserRole.PACIENTE)
  @IsBoolean()
  @Equals(true, { message: 'Aceite dos termos de uso e obrigatorio' })
  consentTermsRequired?: boolean;

  @ValidateIf((o) => o.role === UserRole.PACIENTE)
  @IsBoolean()
  @Equals(true, { message: 'Aceite da politica de privacidade e obrigatorio' })
  consentPrivacyRequired?: boolean;

  @ValidateIf((o) => o.role === UserRole.PACIENTE && o.consentResearchOptional !== undefined)
  @IsBoolean()
  consentResearchOptional?: boolean;

  @ValidateIf((o) => o.role === UserRole.PACIENTE && o.consentAiOptional !== undefined)
  @IsBoolean()
  consentAiOptional?: boolean;

  @ValidateIf((o) => o.role !== UserRole.PACIENTE)
  @IsBoolean()
  @Equals(true, {
    message:
      'Aceite LGPD e uso de dados/exames do paciente e obrigatorio para profissionais',
  })
  consentProfessionalLgpdRequired?: boolean;
}
