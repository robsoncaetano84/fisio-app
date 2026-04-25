// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// G EN ER AT E L AU DO.DTO
// ==========================================
import { IsNotEmpty, IsUUID } from 'class-validator';

export class GenerateLaudoDto {
  @IsNotEmpty({ message: 'ID do paciente e obrigatorio' })
  @IsUUID()
  pacienteId: string;
}
