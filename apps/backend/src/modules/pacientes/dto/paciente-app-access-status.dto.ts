import {
  PacienteAppAccessEvent,
  PacienteVinculoStatus,
} from '../entities/paciente.entity';

export enum PacienteAppAccessState {
  SEM_CONVITE = 'SEM_CONVITE',
  CONVITE_PENDENTE = 'CONVITE_PENDENTE',
  CONVITE_EXPIRADO = 'CONVITE_EXPIRADO',
  ACESSO_ATIVO = 'ACESSO_ATIVO',
  BLOQUEADO_CONFLITO = 'BLOQUEADO_CONFLITO',
}

export class PacienteAppAccessStatusDto {
  pacienteId: string;
  pacienteUsuarioId: string | null;
  vinculoStatus: PacienteVinculoStatus;
  status: PacienteAppAccessState;
  conviteEnviadoEm: Date | null;
  conviteExpiraEm: Date | null;
  conviteAceitoEm: Date | null;
  podeGerarConvite: boolean;
  podeReenviarConvite: boolean;
  podeRevogarConvite: boolean;
  podeDesvincularAcesso: boolean;
  appAccessEvents: PacienteAppAccessEvent[];
}
