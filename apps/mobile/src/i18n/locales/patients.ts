// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// PATIENTS
// ==========================================
type TranslationMap = Record<string, string>;

export const ptPatients: TranslationMap = {
  "patients.years": "anos",
  "patients.appAccessActive": "Acesso app ativo",
  "patients.selectForAnamnesis": "Selecionar para Anamnese",
  "patients.selectForEvolution": "Selecionar para Evolução",
  "patients.selectForPhysicalExam": "Selecionar para Exame Físico",
  "patients.listForbidden":
    "Sessão sem permissão para listar pacientes. Entre com usuário profissional.",
  "patients.attentionTitle": "Pacientes em atenção",
  "patients.attentionMessage":
    "Você tem {{count}} paciente(s) sem evolução recente.",
  "patients.selectForNewAnamnesis":
    "Selecione o paciente para iniciar uma nova anamnese",
  "patients.selectForNewEvolution":
    "Selecione o paciente para registrar uma nova evolução",
  "patients.selectForNewPhysicalExam":
    "Selecione o paciente para iniciar um novo exame físico",
  "patients.guardLinkBeforeAnamnesis":
    "Vincule um usuário paciente antes de preencher a anamnese.",
  "patients.guardLinkBeforeEvolution":
    "Vincule um usuário paciente antes de registrar evolução.",
  "patients.guardAnamnesisBeforeEvolution":
    "Registre a anamnese antes de abrir a evolução.",
  "patients.guardLinkBeforePhysicalExam":
    "Vincule um usuário paciente antes de preencher o exame físico.",
  "patients.guardAnamnesisBeforePhysicalExam":
    "Registre a anamnese antes de abrir o exame físico.",
  "patients.highRiskNoEvolution": "Risco alto de evasão: sem evolução",
  "patients.highRiskDaysNoEvolution":
    "Risco alto: {{days}} dia(s) sem evolução",
  "patients.mediumRiskDaysNoEvolution":
    "Risco moderado: {{days}} dia(s) sem evolução",
  "patients.noneFound": "Nenhum paciente encontrado",
  "patients.tryOtherSearch": "Tente buscar com outros termos",
  "patients.registerFirst": "Cadastre seu primeiro paciente",
  "patients.searchByNameOrCpf": "Buscar por nome ou CPF...",
  "patients.of": "de",
  "patients.foundCount": "paciente(s) encontrado(s)",
  "patients.attentionOnly": "Somente atenção",
  "patients.filterHighRisk": "Risco alto",
  "patients.filterNoEvolution": "Sem evolução",
  "patients.filterLastSessionLate": "Última sessão +7d",
  "patients.filterPending": "Pendências",
  "patients.clearFilters": "Limpar filtros",
  "patients.stateNoAnamnesis": "Sem anamnese",
  "patients.stateReadyForPhysicalExam": "Pronto para exame",
  "patients.stateNoEvolution": "Sem evolução",
  "patients.statePendingReport": "Laudo pendente",
  "patients.focusHighRisk": "Foco: Risco alto",
  "patients.focusEmotional": "Foco: Emocional",
  "patients.focusFunctional": "Foco: Funcional",
  "patients.focusGoal": "Foco: Meta principal",
  "patients.clearFocus": "Limpar foco",
  "patients.scrollLoadMore": "Role para carregar mais",
};

export const enPatients: TranslationMap = {
  "patients.years": "years",
  "patients.appAccessActive": "App access active",
  "patients.selectForAnamnesis": "Select for Anamnesis",
  "patients.selectForEvolution": "Select for Evolution",
  "patients.selectForPhysicalExam": "Select for Physical Exam",
  "patients.listForbidden":
    "Session without permission to list patients. Sign in with a professional user.",
  "patients.attentionTitle": "Patients needing attention",
  "patients.attentionMessage":
    "You have {{count}} patient(s) without recent evolution.",
  "patients.selectForNewAnamnesis": "Select a patient to start a new anamnesis",
  "patients.selectForNewEvolution":
    "Select a patient to record a new evolution",
  "patients.selectForNewPhysicalExam":
    "Select a patient to start a new physical exam",
  "patients.guardLinkBeforeAnamnesis":
    "Link a patient user before filling out anamnesis.",
  "patients.guardLinkBeforeEvolution":
    "Link a patient user before recording evolution.",
  "patients.guardAnamnesisBeforeEvolution":
    "Record anamnesis before opening evolution.",
  "patients.guardLinkBeforePhysicalExam":
    "Link a patient user before filling out the physical exam.",
  "patients.guardAnamnesisBeforePhysicalExam":
    "Record anamnesis before opening the physical exam.",
  "patients.highRiskNoEvolution": "High dropout risk: no evolution",
  "patients.highRiskDaysNoEvolution":
    "High risk: {{days}} day(s) without evolution",
  "patients.mediumRiskDaysNoEvolution":
    "Moderate risk: {{days}} day(s) without evolution",
  "patients.noneFound": "No patients found",
  "patients.tryOtherSearch": "Try searching with other terms",
  "patients.registerFirst": "Register your first patient",
  "patients.searchByNameOrCpf": "Search by name or ID...",
  "patients.of": "of",
  "patients.foundCount": "patient(s) found",
  "patients.attentionOnly": "Attention only",
  "patients.filterHighRisk": "High risk",
  "patients.filterNoEvolution": "No evolution",
  "patients.filterLastSessionLate": "Last session +7d",
  "patients.filterPending": "Pending",
  "patients.clearFilters": "Clear filters",
  "patients.stateNoAnamnesis": "No anamnesis",
  "patients.stateReadyForPhysicalExam": "Ready for exam",
  "patients.stateNoEvolution": "No evolution",
  "patients.statePendingReport": "Report pending",
  "patients.focusHighRisk": "Focus: High risk",
  "patients.focusEmotional": "Focus: Emotional",
  "patients.focusFunctional": "Focus: Functional",
  "patients.focusGoal": "Focus: Main goal",
  "patients.clearFocus": "Clear focus",
  "patients.scrollLoadMore": "Scroll to load more",
};

export const esPatients: TranslationMap = {
  "patients.years": "años",
  "patients.appAccessActive": "Acceso de app activo",
  "patients.selectForAnamnesis": "Seleccionar para Anamnesis",
  "patients.selectForEvolution": "Seleccionar para Evolución",
  "patients.selectForPhysicalExam": "Seleccionar para Examen Físico",
  "patients.listForbidden":
    "Sesión sin permiso para listar pacientes. Inicia sesión con un usuario profesional.",
  "patients.attentionTitle": "Pacientes en atención",
  "patients.attentionMessage":
    "Tienes {{count}} paciente(s) sin evolución reciente.",
  "patients.selectForNewAnamnesis":
    "Selecciona el paciente para iniciar una nueva anamnesis",
  "patients.selectForNewEvolution":
    "Selecciona el paciente para registrar una nueva evolución",
  "patients.selectForNewPhysicalExam":
    "Selecciona el paciente para iniciar un nuevo examen físico",
  "patients.guardLinkBeforeAnamnesis":
    "Vincula un usuario paciente antes de completar la anamnesis.",
  "patients.guardLinkBeforeEvolution":
    "Vincula un usuario paciente antes de registrar evolución.",
  "patients.guardAnamnesisBeforeEvolution":
    "Registra la anamnesis antes de abrir la evolución.",
  "patients.guardLinkBeforePhysicalExam":
    "Vincula un usuario paciente antes de completar el examen físico.",
  "patients.guardAnamnesisBeforePhysicalExam":
    "Registra la anamnesis antes de abrir el examen físico.",
  "patients.highRiskNoEvolution": "Riesgo alto de abandono: sin evolución",
  "patients.highRiskDaysNoEvolution":
    "Riesgo alto: {{days}} día(s) sin evolución",
  "patients.mediumRiskDaysNoEvolution":
    "Riesgo moderado: {{days}} día(s) sin evolución",
  "patients.noneFound": "No se encontraron pacientes",
  "patients.tryOtherSearch": "Prueba buscar con otros términos",
  "patients.registerFirst": "Registra tu primer paciente",
  "patients.searchByNameOrCpf": "Buscar por nombre o CPF...",
  "patients.of": "de",
  "patients.foundCount": "paciente(s) encontrado(s)",
  "patients.attentionOnly": "Solo atención",
  "patients.filterHighRisk": "Riesgo alto",
  "patients.filterNoEvolution": "Sin evolución",
  "patients.filterLastSessionLate": "Última sesión +7d",
  "patients.filterPending": "Pendientes",
  "patients.clearFilters": "Limpiar filtros",
  "patients.stateNoAnamnesis": "Sin anamnesis",
  "patients.stateReadyForPhysicalExam": "Listo para examen",
  "patients.stateNoEvolution": "Sin evolución",
  "patients.statePendingReport": "Informe pendiente",
  "patients.focusHighRisk": "Foco: Riesgo alto",
  "patients.focusEmotional": "Foco: Emocional",
  "patients.focusFunctional": "Foco: Funcional",
  "patients.focusGoal": "Foco: Meta principal",
  "patients.clearFocus": "Limpiar foco",
  "patients.scrollLoadMore": "Desliza para cargar más",
};
