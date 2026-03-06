// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// P AC IE NT E P RO FI LE R ES PO NS E.D TO
// ==========================================
import { LaudoStatus } from '../../laudos/entities/laudo.entity';
import { Paciente } from '../entities/paciente.entity';

export class PacienteProfileResumoDto {
  ultimaEvolucaoEm: Date | null;
  ultimoLaudoAtualizadoEm: Date | null;
  statusLaudo: LaudoStatus | null;
}

export class PacienteProfileResponseDto {
  paciente: Paciente;
  resumo: PacienteProfileResumoDto;
}

