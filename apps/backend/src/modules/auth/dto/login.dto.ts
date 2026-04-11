// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// LOGIN DTO
// ==========================================
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'E-mail ou CPF é obrigatório' })
  @IsString({ message: 'Informe um e-mail ou CPF válido' })
  identificador: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  senha: string;

  // Compatibilidade com clientes antigos.
  email?: string;
}
