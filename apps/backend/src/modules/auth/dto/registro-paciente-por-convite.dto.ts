// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// R EG IS TR O P AC IE NT E P OR C ON VI TE.DTO
// ==========================================
import {
  IsBoolean,
  Equals,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegistroPacientePorConviteDto {
  @IsNotEmpty()
  @IsString()
  conviteToken: string;

  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsEmail({ require_tld: false }, { message: 'E-mail invalido' })
  email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Senha deve ter no minimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Senha deve conter letra maiuscula, minuscula e numero',
  })
  senha: string;

  @IsBoolean()
  @Equals(true, { message: 'Aceite dos termos de uso e obrigatorio' })
  consentTermsRequired: boolean;

  @IsBoolean()
  @Equals(true, { message: 'Aceite da politica de privacidade e obrigatorio' })
  consentPrivacyRequired: boolean;

  @IsBoolean()
  consentResearchOptional: boolean;

  @IsBoolean()
  consentAiOptional: boolean;
}
