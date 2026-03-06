// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// R EG IS TR O P AC IE NT E P OR C ON VI TE.D TO
// ==========================================
import {
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
}

