// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// CREATE P AC IE NT E I NV IT E.DTO
// ==========================================
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreatePacienteInviteDto {
  @IsUUID()
  pacienteId: string;

  @IsInt()
  @Min(1)
  @Max(30)
  diasExpiracao?: number;
}
