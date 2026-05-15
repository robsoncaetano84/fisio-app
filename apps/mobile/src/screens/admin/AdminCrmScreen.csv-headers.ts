export type TableExportKind = "PROFISSIONAIS" | "PACIENTES";

export const timestampForFilename = () =>
  new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

export const currentProfessionalHeaders = [
  "nome",
  "score_conta",
  "status_conta",
  "vulnerabilidade_emocional_absoluta",
  "vulnerabilidade_emocional_percentual",
  "status_carteira_emocional",
  "pacientes",
  "ativos",
  "ultimo_acesso",
  "adesao_percentual",
];

export const currentPatientHeaders = [
  "nome",
  "profissional",
  "status",
  "ultimo_checkin",
  "adesao_percentual",
  "canal",
  "etapa_crm",
];

export const fullProfessionalHeaders = [
  "nome",
  "email",
  "especialidade",
  "score_conta",
  "status_conta",
  "vulnerabilidade_emocional_absoluta",
  "vulnerabilidade_emocional_percentual",
  "status_carteira_emocional",
  "pacientes",
  "ativos",
  "ultimo_acesso",
  "adesao_percentual",
];

export const fullPatientHeaders = [
  "nome",
  "profissional",
  "status",
  "emocional_vulnerabilidade",
  "ultimo_checkin",
  "adesao_percentual",
  "canal",
  "etapa_crm",
  "contato_email",
  "cidade_uf",
  "vinculado_usuario",
];

export const leadHeaders = [
  "nome",
  "empresa",
  "canal",
  "etapa",
  "valor_potencial",
  "responsavel",
  "atualizado_em",
];

export const taskHeaders = [
  "titulo",
  "status",
  "prazo",
  "lead",
  "responsavel",
  "atualizado_em",
];

export const interactionHeaders = [
  "lead",
  "tipo",
  "resumo",
  "responsavel",
  "ocorrido_em",
];
