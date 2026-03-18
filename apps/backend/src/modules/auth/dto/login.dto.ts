// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// L OG IN.D TO
// ==========================================
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  senha: string;
}
