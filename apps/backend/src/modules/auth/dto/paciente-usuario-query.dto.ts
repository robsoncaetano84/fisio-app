// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// P AC IE NT E U SU AR IO Q UE RY.D TO
// ==========================================
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class PacienteUsuarioQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail({ require_tld: false }, { message: 'Email invalido' })
  email: string;
}
