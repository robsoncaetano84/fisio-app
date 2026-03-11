// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// C RE AT E P AC IE NT E I NV IT E.D TO
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
