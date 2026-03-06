// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// G EN ER AT E L AU DO.D TO
// ==========================================
import { IsNotEmpty, IsUUID } from 'class-validator';

export class GenerateLaudoDto {
  @IsNotEmpty({ message: 'ID do paciente e obrigatorio' })
  @IsUUID()
  pacienteId: string;
}
