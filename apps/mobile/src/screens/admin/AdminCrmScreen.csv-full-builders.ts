import type { CrmAdminPatient, CrmLead } from "../../services/crm";
import {
  getCrmAdminPatients,
  getCrmAdminProfessionals,
} from "../../services/crm";
import type {
  PacLinkFilter,
  ProfActiveFilter,
  ProfEmotionalConcentrationFilter,
} from "./AdminCrmScreen.types";
import {
  accountHealthStatusLabel,
  comparePac,
  compareProf,
  computeAccountHealthScore,
  dt,
  type PacRow,
  type PacSortKey,
  type ProfRow,
  type ProfSortKey,
  type SortDir,
} from "./AdminCrmScreen.utils";
import { buildProfessionalRows } from "./AdminCrmScreen.rows";

const buildEmotionalAggregate = (patients: CrmAdminPatient[]) => {
  const emotionalAgg = new Map<string, { vulneraveis: number; total: number }>();
  patients.forEach((patient) => {
    const current = emotionalAgg.get(patient.usuarioId) || {
      vulneraveis: 0,
      total: 0,
    };
    current.total += 1;
    if (patient.emocional?.vulnerabilidade) current.vulneraveis += 1;
    emotionalAgg.set(patient.usuarioId, current);
  });
  return emotionalAgg;
};

type FullProfessionalCsvRow = {
  id: string;
  nome: string;
  cidade: string;
  score_conta: number;
  status_conta: string;
  vulnerabilidade_emocional_absoluta: string;
  vulnerabilidade_emocional_percentual: number;
  status_carteira_emocional: string;
  pacientes: number;
  ativos: number;
  ultimo_acesso: string;
  adesao_percentual: number;
  email: string;
  especialidade: string;
};

type FullPatientCsvRow = {
  nome: string;
  profissional: string;
  status: "ATIVO" | "RISCO";
  emocional_vulnerabilidade: "SIM" | "NAO";
  ultimo_checkin: string;
  adesao_percentual: number;
  canal: CrmLead["canal"];
  etapa_crm: string;
  contato_email: string;
  cidade_uf: string;
  vinculado_usuario: "SIM" | "NAO";
};

const toSortableProfessionalRow = (
  row: FullProfessionalCsvRow,
): ProfRow => ({
  id: row.id,
  nome: row.nome,
  cidade: row.cidade,
  pacientes: Number(row.pacientes),
  ativos: Number(row.ativos),
  ultimoAcesso: row.ultimo_acesso,
  adesao: Number(row.adesao_percentual),
  leadIds: [],
});

const fallbackLeadForPatientRow = (row: FullPatientCsvRow): CrmLead => ({
  id: "",
  nome: row.nome,
  empresa: row.profissional,
  canal: "OUTRO",
  stage: "NOVO",
  responsavelNome: null,
  responsavelUsuarioId: null,
  valorPotencial: 0,
  observacoes: null,
  ativo: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const toSortablePatientRow = (
  row: FullPatientCsvRow,
  leads: CrmLead[],
): PacRow => ({
  id: row.nome,
  nome: row.nome,
  profissionalId: "",
  profissionalNome: row.profissional,
  status: row.status,
  emocionalVulneravel: row.emocional_vulnerabilidade === "SIM",
  emocionalResumo: null,
  ultimoCheckin: row.ultimo_checkin,
  adesao: Number(row.adesao_percentual),
  lead:
    leads.find((lead) => lead.nome.toLowerCase() === row.nome.toLowerCase()) ||
    fallbackLeadForPatientRow(row),
});

export async function buildFullProfessionalRows({
  query,
  profActiveFilter,
  profEspecialidadeFilter,
  profEmotionalConcentrationFilter,
  profSort,
}: {
  query: string;
  profActiveFilter: ProfActiveFilter;
  profEspecialidadeFilter: string;
  profEmotionalConcentrationFilter: ProfEmotionalConcentrationFilter;
  profSort: { key: ProfSortKey; dir: SortDir };
}) {
  const allPatientsForEmotional = await getCrmAdminPatients();
  const emotionalAgg = buildEmotionalAggregate(allPatientsForEmotional);
  const allProfessionals = await getCrmAdminProfessionals({
    q: query || undefined,
    ativo: profActiveFilter === "ATIVOS" ? true : undefined,
    especialidade: profEspecialidadeFilter.trim() || undefined,
  });
  const professionalRows = buildProfessionalRows(allProfessionals, []);
  return allProfessionals
    .map((professional, index): FullProfessionalCsvRow => {
      const profRow = professionalRows[index];
      const score = computeAccountHealthScore(profRow, []);
      const emotional = emotionalAgg.get(professional.id) || {
        vulneraveis: 0,
        total: 0,
      };
      const emocionalPercentual =
        emotional.total > 0
          ? Math.round((emotional.vulneraveis / emotional.total) * 100)
          : 0;
      const emocionalStatus =
        emotional.total < 5
          ? "BASE_PEQUENA"
          : emocionalPercentual >= 40
            ? "RISCO"
            : emocionalPercentual >= 25
              ? "ATENCAO"
              : "OK";
      return {
        id: professional.id,
        nome: professional.nome,
        cidade: profRow.cidade,
        score_conta: score.score,
        status_conta: accountHealthStatusLabel(score.status),
        vulnerabilidade_emocional_absoluta: `${emotional.vulneraveis}/${emotional.total}`,
        vulnerabilidade_emocional_percentual: emocionalPercentual,
        status_carteira_emocional: emocionalStatus,
        pacientes: professional.pacientesTotal,
        ativos: professional.pacientesAtivos,
        ultimo_acesso: profRow.ultimoAcesso,
        adesao_percentual: profRow.adesao,
        email: professional.email,
        especialidade: professional.especialidade || "",
      };
    })
    .filter((row) => {
      if (profEmotionalConcentrationFilter === "TODOS") return true;
      return (
        row.status_carteira_emocional === "ATENCAO" ||
        row.status_carteira_emocional === "RISCO"
      );
    })
    .sort((left, right) =>
      compareProf(
        toSortableProfessionalRow(left),
        toSortableProfessionalRow(right),
        profSort,
      ),
    );
}

export async function buildFullPatientRows({
  query,
  pacLinkFilter,
  pacCidadeFilter,
  pacUfFilter,
  pacSort,
  leads,
  stageLabel,
  noLinkLabel,
}: {
  query: string;
  pacLinkFilter: PacLinkFilter;
  pacCidadeFilter: string;
  pacUfFilter: string;
  pacSort: { key: PacSortKey; dir: SortDir };
  leads: CrmLead[];
  stageLabel: Record<CrmLead["stage"], string>;
  noLinkLabel: string;
}) {
  const allPatients = await getCrmAdminPatients({
    q: query || undefined,
    vinculadoUsuarioPaciente:
      pacLinkFilter === "VINCULADOS"
        ? true
        : pacLinkFilter === "SEM_USUARIO"
          ? false
          : undefined,
    cidade: pacCidadeFilter.trim() || undefined,
    uf: pacUfFilter.trim() || undefined,
  });

  return allPatients
    .map((patient): FullPatientCsvRow => {
      const linkedLead =
        leads.find(
          (lead) =>
            lead.nome.toLowerCase() === patient.nomeCompleto.toLowerCase(),
        ) || null;
      const ultimo = dt(patient.updatedAt || patient.createdAt);
      const risco =
        Date.now() - new Date(patient.updatedAt || patient.createdAt).getTime() >
        1000 * 60 * 60 * 24 * 10;
      return {
        nome: patient.nomeCompleto,
        profissional: patient.profissionalNome || noLinkLabel,
        status: risco ? "RISCO" : "ATIVO",
        emocional_vulnerabilidade: patient.emocional?.vulnerabilidade
          ? "SIM"
          : "NAO",
        ultimo_checkin: ultimo,
        adesao_percentual: risco ? 48 : 80,
        canal: linkedLead?.canal || "OUTRO",
        etapa_crm: linkedLead ? stageLabel[linkedLead.stage] : "Novo",
        contato_email: patient.contatoEmail || "",
        cidade_uf: [patient.enderecoCidade, patient.enderecoUf]
          .filter(Boolean)
          .join("/"),
        vinculado_usuario: patient.pacienteUsuarioId ? "SIM" : "NAO",
      };
    })
    .sort((left, right) =>
      comparePac(
        toSortablePatientRow(left, leads),
        toSortablePatientRow(right, leads),
        pacSort,
      ),
    );
}
