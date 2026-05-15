import type {
  CrmAdminPatient,
  CrmAdminProfessional,
  CrmInteractionType,
  CrmLeadChannel,
  CrmLeadStage,
} from "../../services/crm";

export const STAGES: CrmLeadStage[] = [
  "NOVO",
  "CONTATO",
  "PROPOSTA",
  "FECHADO",
];

export const CHANNELS: CrmLeadChannel[] = [
  "SITE",
  "WHATSAPP",
  "INDICACAO",
  "INSTAGRAM",
  "OUTRO",
];

export const INTERACTION_TYPES: CrmInteractionType[] = [
  "LIGACAO",
  "WHATSAPP",
  "PROPOSTA",
  "DEMO",
  "EMAIL",
  "REUNIAO",
  "OUTRO",
];

export const CRM_PREFS_KEY = "crm:web:prefs:v1";
export const CRM_AUTOMATIONS_DISMISSED_KEY_PREFIX =
  "crm:web:automations:dismissed:v1";
export const CRM_AUTOMATIONS_HISTORY_KEY_PREFIX =
  "crm:web:automations:history:v1";

export const createEmptyLeadForm = () => ({
  id: "",
  nome: "",
  empresa: "",
  canal: "SITE" as CrmLeadChannel,
  stage: "NOVO" as CrmLeadStage,
  valor: "",
});

export const createEmptyTaskForm = (leadId = "") => ({
  id: "",
  titulo: "",
  dueAt: "",
  leadId,
});

export const createEmptyInteractionForm = () => ({
  id: "",
  tipo: "LIGACAO" as CrmInteractionType,
  resumo: "",
});

export const createEmptyProfessionalEditForm = () => ({
  nome: "",
  email: "",
  especialidade: "",
  registroProf: "",
  ativo: true,
});

export const createEmptyPatientEditForm = () => ({
  nomeCompleto: "",
  cpf: "",
  dataNascimento: "",
  sexo: "OUTRO",
  estadoCivil: "SOLTEIRO",
  profissao: "",
  contatoWhatsapp: "",
  contatoTelefone: "",
  contatoEmail: "",
  enderecoCidade: "",
  enderecoUf: "",
  ativo: true,
});

export const createProfessionalEditForm = (professional: CrmAdminProfessional) => ({
  nome: professional.nome || "",
  email: professional.email || "",
  especialidade: professional.especialidade || "",
  registroProf: professional.registroProf || "",
  ativo: !!professional.ativo,
});

export const createPatientEditForm = (patient: CrmAdminPatient) => ({
  nomeCompleto: patient.nomeCompleto || "",
  cpf: String(patient.cpf || "").replace(/\D/g, ""),
  dataNascimento: patient.dataNascimento
    ? String(patient.dataNascimento).slice(0, 10)
    : "",
  sexo: ["MASCULINO", "FEMININO", "OUTRO"].includes(String(patient.sexo))
    ? String(patient.sexo)
    : "OUTRO",
  estadoCivil: [
    "SOLTEIRO",
    "CASADO",
    "VIUVO",
    "DIVORCIADO",
    "UNIAO_ESTAVEL",
  ].includes(String(patient.estadoCivil))
    ? String(patient.estadoCivil)
    : "SOLTEIRO",
  profissao: patient.profissao || "",
  contatoWhatsapp: String(patient.contatoWhatsapp || "").replace(/\D/g, ""),
  contatoTelefone: "",
  contatoEmail: patient.contatoEmail || "",
  enderecoCidade: patient.enderecoCidade || "",
  enderecoUf: (patient.enderecoUf || "").toUpperCase(),
  ativo: !!patient.ativo,
});
