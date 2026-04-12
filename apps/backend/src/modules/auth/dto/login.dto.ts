// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// LOGIN DTO
// ==========================================
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  // Novo contrato (frontend atual): e-mail OU CPF em um único campo.
  @IsOptional()
  @IsString({ message: 'Informe um e-mail ou CPF válido' })
  identificador?: string;

  // Compatibilidade com clientes antigos.
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  senha: string;
}
