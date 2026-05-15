import type {
  CrmAdminPatient,
  CrmAdminProfessional,
  CrmLead,
} from "../../services/crm";
import { dt, type PacRow, type ProfRow } from "./AdminCrmScreen.utils";

const FALLBACK_CITIES = [
  "São Paulo/SP",
  "Rio de Janeiro/RJ",
  "Belo Horizonte/MG",
  "Curitiba/PR",
];

const getFallbackCity = (index: number) =>
  FALLBACK_CITIES[index % FALLBACK_CITIES.length];

export function buildProfessionalRows(
  crmProfessionals: CrmAdminProfessional[],
  leads: CrmLead[],
): ProfRow[] {
  if (crmProfessionals.length) {
    return crmProfessionals.map((professional, index) => ({
      id: professional.id,
      nome: professional.nome,
      cidade: professional.especialidade || getFallbackCity(index),
      pacientes: professional.pacientesTotal,
      ativos: professional.pacientesAtivos,
      ultimoAcesso: dt(
        professional.lastPacienteUpdate ||
          professional.updatedAt ||
          professional.createdAt,
      ),
      adesao:
        professional.pacientesTotal > 0
          ? Math.max(
              40,
              Math.min(
                98,
                Math.round(
                  (professional.pacientesAtivos /
                    professional.pacientesTotal) *
                    100,
                ),
              ),
            )
          : 0,
      leadIds: [],
    }));
  }

  const groups = new Map<string, CrmLead[]>();
  leads.forEach((lead) => {
    const key = (lead.empresa || "Atendimento individual").trim();
    groups.set(key, [...(groups.get(key) || []), lead]);
  });

  return Array.from(groups.entries()).map(([nome, leadGroup], index) => ({
    id: `prof-${index}`,
    nome,
    cidade: getFallbackCity(index),
    pacientes: leadGroup.length,
    ativos: leadGroup.filter((lead) => lead.stage !== "FECHADO").length,
    ultimoAcesso: dt(
      leadGroup[0]?.updatedAt ||
        leadGroup[0]?.createdAt ||
        new Date().toISOString(),
    ),
    adesao: Math.max(
      40,
      Math.min(
        96,
        60 +
          leadGroup.filter((lead) => lead.stage !== "NOVO").length * 8 -
          leadGroup.filter((lead) => lead.stage === "NOVO").length * 3,
      ),
    ),
    leadIds: leadGroup.map((lead) => lead.id),
  }));
}

const buildFallbackLead = (patient: CrmAdminPatient): CrmLead => ({
  id: "",
  nome: patient.nomeCompleto,
  empresa: patient.profissionalNome,
  canal: "OUTRO",
  stage: "NOVO",
  responsavelNome: patient.profissionalNome,
  responsavelUsuarioId: patient.usuarioId,
  valorPotencial: 0,
  observacoes: null,
  ativo: true,
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt,
});

type BuildPatientRowsParams = {
  crmPatients: CrmAdminPatient[];
  leads: CrmLead[];
  profs: ProfRow[];
  noLinkLabel: string;
};

export function buildPatientRows({
  crmPatients,
  leads,
  profs,
  noLinkLabel,
}: BuildPatientRowsParams): PacRow[] {
  if (crmPatients.length) {
    return crmPatients.map((patient) => {
      const linkedLead =
        leads.find(
          (lead) =>
            patient.contatoEmail &&
            lead.nome.toLowerCase() === patient.nomeCompleto.toLowerCase(),
        ) ||
        leads.find(
          (lead) =>
            lead.nome.toLowerCase() === patient.nomeCompleto.toLowerCase(),
        ) ||
        leads[0];
      const risco =
        Date.now() - new Date(patient.updatedAt || patient.createdAt).getTime() >
        1000 * 60 * 60 * 24 * 10;

      return {
        id: patient.id,
        nome: patient.nomeCompleto,
        profissionalId: patient.usuarioId,
        profissionalNome: patient.profissionalNome || noLinkLabel,
        status: risco ? "RISCO" : "ATIVO",
        emocionalVulneravel: Boolean(patient.emocional?.vulnerabilidade),
        emocionalResumo: patient.emocional
          ? {
              estresse: patient.emocional.nivelEstresse ?? null,
              energia: patient.emocional.energiaDiaria ?? null,
              apoio: patient.emocional.apoioEmocional ?? null,
              sonoQualidade: patient.emocional.qualidadeSono ?? null,
              humor: patient.emocional.humorPredominante ?? null,
              updatedAt: patient.emocional.updatedAt ?? null,
            }
          : null,
        ultimoCheckin: dt(patient.updatedAt || patient.createdAt),
        adesao: risco ? 48 : 80,
        lead: linkedLead || buildFallbackLead(patient),
      };
    });
  }

  return leads.map((lead, index) => {
    const professional = profs.find((item) => item.leadIds.includes(lead.id));
    const risco = lead.stage === "NOVO";
    return {
      id: `pac-${lead.id}`,
      nome: lead.nome,
      profissionalId: professional?.id || "",
      profissionalNome: professional?.nome || noLinkLabel,
      status: risco ? "RISCO" : "ATIVO",
      emocionalVulneravel: false,
      emocionalResumo: null,
      ultimoCheckin: dt(lead.updatedAt || lead.createdAt),
      adesao: risco ? 48 + (index % 10) : 72 + (index % 20),
      lead,
    };
  });
}
