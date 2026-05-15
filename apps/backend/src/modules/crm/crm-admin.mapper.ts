import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { maskEmail, maskPhone } from './crm-sensitive-data.util';

type CrmAdminMapperOptions = {
  includeSensitive?: boolean;
};

export type CrmProfessionalPatientCounts = {
  total: number;
  ativos: number;
  lastPacienteUpdate?: Date | string | null;
};

type PacienteWithAdminRelations = Paciente & {
  usuario?: Usuario | null;
  pacienteUsuario?: Usuario | null;
};

export function mapCrmAdminProfessional(
  prof: Usuario,
  counts?: CrmProfessionalPatientCounts,
  options?: CrmAdminMapperOptions,
) {
  return {
    id: prof.id,
    nome: prof.nome,
    email: options?.includeSensitive ? prof.email : maskEmail(prof.email),
    registroProf: prof.registroProf || null,
    especialidade: prof.especialidade || null,
    ativo: prof.ativo,
    role: prof.role,
    createdAt: prof.createdAt,
    updatedAt: prof.updatedAt,
    pacientesTotal: counts?.total || 0,
    pacientesAtivos: counts?.ativos || 0,
    lastPacienteUpdate: counts?.lastPacienteUpdate || null,
  };
}

export function mapCrmAdminPatient(
  paciente: PacienteWithAdminRelations,
  lastAnamnese?: Anamnese | null,
  options?: CrmAdminMapperOptions,
) {
  return {
    id: paciente.id,
    nomeCompleto: paciente.nomeCompleto,
    cpf: options?.includeSensitive ? paciente.cpf : maskPhone(paciente.cpf),
    dataNascimento: paciente.dataNascimento,
    sexo: paciente.sexo,
    estadoCivil: paciente.estadoCivil || null,
    contatoEmail: options?.includeSensitive
      ? paciente.contatoEmail || null
      : maskEmail(paciente.contatoEmail),
    contatoWhatsapp: options?.includeSensitive
      ? paciente.contatoWhatsapp || null
      : maskPhone(paciente.contatoWhatsapp),
    enderecoCidade: paciente.enderecoCidade || null,
    enderecoUf: paciente.enderecoUf || null,
    profissao: paciente.profissao || null,
    ativo: paciente.ativo,
    createdAt: paciente.createdAt,
    updatedAt: paciente.updatedAt,
    usuarioId: paciente.usuarioId,
    profissionalNome: paciente.usuario?.nome || null,
    profissionalEmail: options?.includeSensitive
      ? paciente.usuario?.email || null
      : maskEmail(paciente.usuario?.email || null),
    pacienteUsuarioId: paciente.pacienteUsuarioId,
    pacienteUsuarioEmail: options?.includeSensitive
      ? paciente.pacienteUsuario?.email || null
      : maskEmail(paciente.pacienteUsuario?.email || null),
    emocional: mapCrmAdminPatientEmotionalContext(lastAnamnese),
  };
}

export function mapCrmAdminPatientEmotionalContext(
  lastAnamnese?: Anamnese | null,
) {
  if (!lastAnamnese) return null;

  return {
    nivelEstresse: lastAnamnese.nivelEstresse ?? null,
    energiaDiaria: lastAnamnese.energiaDiaria ?? null,
    apoioEmocional: lastAnamnese.apoioEmocional ?? null,
    qualidadeSono: lastAnamnese.qualidadeSono ?? null,
    humorPredominante: lastAnamnese.humorPredominante || null,
    vulnerabilidade:
      (lastAnamnese.nivelEstresse ?? 0) >= 8 ||
      (typeof lastAnamnese.energiaDiaria === 'number' &&
        lastAnamnese.energiaDiaria <= 3) ||
      (typeof lastAnamnese.apoioEmocional === 'number' &&
        lastAnamnese.apoioEmocional <= 3) ||
      (typeof lastAnamnese.qualidadeSono === 'number' &&
        lastAnamnese.qualidadeSono <= 3),
    updatedAt: lastAnamnese.createdAt,
  };
}
