// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// P AC IE NT E P RO FI LE R ES PO NS E.DTO
// ==========================================
import { LaudoStatus } from '../../laudos/entities/laudo.entity';
import { Paciente } from '../entities/paciente.entity';

export class PacienteProfileResumoDto {
  ultimaEvolucaoEm: Date | null;
  ultimoLaudoAtualizadoEm: Date | null;
  statusLaudo: LaudoStatus | null;
}

export class PacienteProfileResponseDto {
  vinculado: boolean;
  paciente: Paciente | null;
  resumo: PacienteProfileResumoDto | null;
}
