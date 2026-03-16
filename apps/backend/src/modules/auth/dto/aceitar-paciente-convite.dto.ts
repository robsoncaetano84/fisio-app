import { IsNotEmpty, IsString } from 'class-validator';

export class AceitarPacienteInviteDto {
  @IsNotEmpty()
  @IsString()
  conviteToken: string;
}
