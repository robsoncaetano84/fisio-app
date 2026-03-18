// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// C RE AT E U SU AR IO.D TO
// ==========================================
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../entities/usuario.entity';

export class CreateUsuarioDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  nome: string;

  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(8, { message: 'Senha deve ter no minimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Senha deve conter letra maiuscula, minuscula e numero',
  })
  senha: string;

  @IsOptional()
  @IsString()
  registroProf?: string;

  @IsOptional()
  @IsString()
  especialidade?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}


