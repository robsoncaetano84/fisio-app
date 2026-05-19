// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// PATIENT DETAILS
// ==========================================
type TranslationMap = Record<string, string>;

export const ptPatientDetails: TranslationMap = {
  "patientDetails.notFound": "Paciente não encontrado",
  "patientDetails.whatsapp": "WhatsApp",
  "patientDetails.call": "Ligar",
  "patientDetails.email": "E-mail",
  "patientDetails.patientData": "Dados",
  "patientDetails.personalData": "Dados Pessoais",
  "patientDetails.cpf": "CPF",
  "patientDetails.profession": "Profissão",
  "patientDetails.contact": "Contato",
  "patientDetails.address": "Endereço",
  "patientDetails.addressLabel": "Endereço",
  "patientDetails.latestAnamneses": "Últimas Anamneses",
  "patientDetails.noAnamnesis": "Nenhuma anamnese registrada",
  "patientDetails.adherenceRetention": "Adesão e Retenção",
  "patientDetails.adherence28": "Aderência (últimos 28 dias)",
  "patientDetails.sessions28": "Sessões nos últimos 28 dias: {{count}}/4",
  "patientDetails.lastSession": "Última sessão",
  "patientDetails.noEvolutionRegistered": "sem evolução registrada",
  "patientDetails.daysAgo": "{{days}} dia(s) atrás",
  "patientDetails.nextSuggestedSession": "Próxima sessão sugerida",
  "patientDetails.dropoutRisk": "Risco de evasão: {{risk}}",
  "patientDetails.quickMessages": "Mensagens Rápidas",
  "patientDetails.latestEvolutions": "Últimas Evoluções",
  "patientDetails.noEvolution": "Nenhuma evolução registrada",
  "patientDetails.noAdjustments": "Sem avaliação clínica",
  "patientDetails.adherenceChecks": "Aderência e Checks",
  "patientDetails.prescribeActivity": "Prescrever Atividade",
  "patientDetails.recordEvolution": "Registrar Evolução",
  "patientDetails.readinessSummary": "Resumo de prontidão",
  "patientDetails.readinessLinkTitle": "Paciente sem vínculo de app",
  "patientDetails.readinessLinkDescription":
    "Vincule o paciente no app para liberar o fluxo clínico completo.",
  "patientDetails.readinessLinkAction": "Vincular paciente",
  "patientDetails.readinessAnamnesisTitle": "Pronto para iniciar anamnese",
  "patientDetails.readinessAnamnesisDescription":
    "Próximo passo recomendado: preencher a anamnese.",
  "patientDetails.readinessAnamnesisAction": "Continuar fluxo · Anamnese",
  "patientDetails.readinessPhysicalExamTitle": "Pronto para exame físico",
  "patientDetails.readinessPhysicalExamDescription":
    "Anamnese concluída. Próximo passo recomendado: exame físico.",
  "patientDetails.readinessPhysicalExamAction":
    "Continuar fluxo · Exame físico",
  "patientDetails.readinessEvolutionTitle": "Pronto para registrar evolução",
  "patientDetails.readinessEvolutionDescription":
    "Exame físico concluído. Próximo passo recomendado: evolução.",
  "patientDetails.readinessEvolutionAction": "Continuar fluxo · Evolução",
  "patientDetails.readinessReportPlanTitle": "Pronto para laudo e plano",
  "patientDetails.readinessReportPlanDescription":
    "Fluxo base concluído. Gere laudo/plano para fechar a sessão.",
  "patientDetails.readinessReportPlanAction": "Continuar fluxo · Laudo/Plano",
  "patientDetails.readinessPlanAction": "Continuar fluxo · Plano",
  "patientDetails.readinessMonitoringTitle": "Sessão pronta para fechamento",
  "patientDetails.readinessMonitoringDescription":
    "Fluxo clínico concluído. Revise adesão/check-ins e pendências da sessão.",
  "patientDetails.readinessMonitoringAction": "Abrir adesão e checks",
  "patientDetails.clinicalFlowSteps": "Fluxo clínico em etapas",
  "patientDetails.flowStatusDone": "Concluído",
  "patientDetails.flowStatusInProgress": "Em andamento",
  "patientDetails.flowStatusPending": "Pendente",
  "patientDetails.flowStatusNotStarted": "Não iniciado",
  "patientDetails.noPermissionAnamnesis":
    "Sem permissão para visualizar anamneses deste paciente",
  "patientDetails.loadAnamnesisError": "Não foi possível carregar as anamneses",
  "patientDetails.noPermissionEvolution":
    "Sem permissão para visualizar evoluções deste paciente",
  "patientDetails.loadEvolutionError": "Não foi possível carregar as evoluções",
  "patientDetails.openWhatsappError": "Não foi possível abrir o WhatsApp",
  "patientDetails.guardCreateLinkBeforeAnamnesis":
    "Crie o vínculo do paciente antes de preencher a anamnese.",
  "patientDetails.guardCreateLinkFirst": "Crie o vínculo do paciente primeiro.",
  "patientDetails.guardAnamnesisBeforePhysicalExam":
    "Registre a anamnese antes de abrir o exame físico.",
  "patientDetails.guardAnamnesisBeforeEvolution":
    "Registre a anamnese antes de abrir a evolução.",
  "patientDetails.guardPhysicalExamBeforeEvolution":
    "Preencha o exame físico antes de registrar a evolução.",
  "patientDetails.guardLinkAndAnamnesisBeforeReport":
    "Registre a anamnese antes de abrir o laudo.",
  "patientDetails.guardSaveReportBeforePlan":
    "Salve o laudo antes de editar o plano",
  "patientDetails.notInformed": "Não informado",
  "patientDetails.sex": "Sexo",
  "patientDetails.phone": "Telefone",
  "patientDetails.neighborhood": "Bairro",
  "patientDetails.city": "Cidade",
  "patientDetails.quickMessageCheckinLabel": "Lembrete check-in",
  "patientDetails.quickMessageCheckinText":
    "Oi {{name}}, passando para lembrar do seu check-in de hoje no app. Qualquer dificuldade, me avise.",
  "patientDetails.quickMessageAdherenceLabel": "Reforço de aderência",
  "patientDetails.quickMessageAdherenceText":
    "Oi {{name}}, sua consistência faz diferença no tratamento. Tente manter os exercícios desta semana.",
  "patientDetails.quickMessageScheduleLabel": "Agendar retorno",
  "patientDetails.quickMessageScheduleText":
    "Oi {{name}}, vamos agendar seu retorno para revisar sua evolução e ajustar o plano.",
  "patientDetails.quickMessageEmotionalSupportLabel": "Contato acolhedor",
  "patientDetails.quickMessageEmotionalSupportText":
    "Oi {{name}}, estou passando para saber como você está se sentindo. Se estiver difícil manter a rotina, me conte para ajustarmos o plano com mais conforto.",
  "patientDetails.quickMessageFunctionalGoalLabel": "Foco na meta funcional",
  "patientDetails.quickMessageFunctionalGoalText":
    "Oi {{name}}, quero alinhar sua rotina de exercícios com sua meta funcional. Me conte como você está nas atividades do dia a dia para ajustarmos o plano.",
  "patientDetails.documentsExams": "Documentos e exames",
  "patientDetails.attachExam": "Anexar exame",
  "patientDetails.loadingExams": "Carregando exames...",
  "patientDetails.noExamsAttached": "Nenhum exame anexado.",
  "patientDetails.openExam": "Abrir",
  "patientDetails.openingExam": "Abrindo...",
  "patientDetails.removeExam": "Remover",
  "patientDetails.removingExam": "Removendo...",
  "patientDetails.examUploadedSuccess": "Exame anexado com sucesso.",
  "patientDetails.examUploadInvalidFile": "Arquivo inválido para upload.",
  "patientDetails.examUploadError": "Não foi possível anexar o exame.",
  "patientDetails.examsLoadError":
    "Não foi possível carregar os exames anexados.",
  "patientDetails.examOpenError": "Falha ao abrir o exame. Tente novamente.",
  "patientDetails.examErrorNetwork":
    "Sem conexão estável. Verifique a internet e tente novamente.",
  "patientDetails.examErrorSessionExpired":
    "Sessão expirada. Faça login novamente.",
  "patientDetails.examErrorForbidden": "Sem permissão para acessar este exame.",
  "patientDetails.examErrorNotFound": "Exame não encontrado ou já removido.",
  "patientDetails.examErrorTooLarge": "Arquivo muito grande. O limite é 10 MB.",
  "patientDetails.examErrorUnsupportedType":
    "Tipo de arquivo não suportado. Envie PDF ou imagem.",
  "patientDetails.examErrorInvalidData":
    "Dados do exame inválidos. Revise o arquivo e tente novamente.",
  "patientDetails.examErrorRateLimit":
    "Muitas tentativas. Aguarde alguns segundos para tentar novamente.",
  "patientDetails.examErrorServer":
    "Serviço indisponível no momento. Tente novamente.",
  "patientDetails.examRemoveSuccess": "Exame removido.",
  "patientDetails.examRemoveError": "Não foi possível remover o exame.",
  "patientDetails.openExamDialogTitle": "Abrir exame",
  "patientDetails.releaseAnamnesis": "Liberar anamnese",
  "patientDetails.blockAnamnesis": "Bloquear anamnese",
  "patientDetails.anamnesisPermissionEnabled":
    "Preenchimento da anamnese liberado para o paciente.",
  "patientDetails.anamnesisPermissionDisabled":
    "Preenchimento da anamnese ainda não liberado para o paciente.",
  "patientDetails.anamnesisPermissionUpdateError":
    "Não foi possível atualizar a permissão da anamnese.",
  "patientDetails.ananesisPermissionEnabled":
    "Preenchimento da anamnese liberado para o paciente.",
  "patientDetails.ananesisPermissionDisabled":
    "Preenchimento da anamnese ainda não liberado para o paciente.",
  "patientDetails.ananesisPermissionUpdateError":
    "Não foi possível atualizar a permissão da anamnese.",
  "patientDetails.ananmesisPermissionEnabled":
    "Preenchimento da anamnese liberado para o paciente.",
  "patientDetails.ananmesisPermissionDisabled":
    "Preenchimento da anamnese ainda não liberado para o paciente.",
  "patientDetails.ananmesisPermissionUpdateError":
    "Não foi possível atualizar a permissão da anamnese.",
  "patientDetails.updating": "Atualizando...",
  "patientDetails.appAccessLinkWarning":
    "Paciente sem vínculo com acesso do app. Vincule um e-mail para liberar os recursos do paciente.",
  "patientDetails.startHereTitle": "Vamos iniciar por aqui",
  "patientDetails.startHereDescription":
    "Abra a ficha de anamnese para registrar os dados iniciais do paciente.",
  "patientDetails.startHereAction": "Abrir ficha de anamnese",
  "patientDetails.caseSummary": "Resumo do caso",
  "patientDetails.recentHistory": "Histórico recente",
  "patientDetails.anamnesis": "Anamnese",
  "patientDetails.physicalExam": "Exame físico",
  "patientDetails.evolution": "Evolução",
  "patientDetails.report": "Laudo",
  "patientDetails.plan": "Plano",
  "patientDetails.documentsCount": "{{count}} arquivo(s) anexado(s)",
  "patientDetails.latestDocument": "Último: {{name}}",
  "patientDetails.attachedFileFallback": "arquivo anexado",
  "patientDetails.hideDocuments": "Ocultar documentos",
  "patientDetails.showAllDocuments": "Ver todos os documentos",
  "patientDetails.followUp": "Acompanhamento",
  "patientDetails.noSession": "Sem sessão",
  "patientDetails.adherence": "Aderência",
  "patientDetails.risk": "Risco",
  "patientDetails.recommendedAction": "Ação recomendada",
  "patientDetails.lastSupportiveContact": "Último contato acolhedor: {{date}}",
  "patientDetails.hideMessages": "Ocultar mensagens",
  "patientDetails.seekReasonExisting": "Sintoma existente",
  "patientDetails.seekReasonPreventive": "Preventivo",
  "patientDetails.mainComplaint": "Queixa principal",
  "patientDetails.affectedAreas": "Áreas afetadas",
  "patientDetails.painIntensityShort": "dor {{value}}/10",
  "patientDetails.limitations": "Limitações",
  "patientDetails.patientGoal": "Meta do paciente",
  "patientDetails.dateUnavailable": "data indisponível",
  "patientDetails.latestEvolution": "Última evolução",
  "patientDetails.attention": "Atenção",
  "patientDetails.summary": "Resumo",
  "patientDetails.noClinicalSummary":
    "Ainda não há anamnese ou evolução suficiente para montar um resumo clínico.",
  "patientDetails.lifestyleSleep": "Sono: {{value}}",
  "patientDetails.lifestyleSleepQuality": "Qualidade do sono: {{value}}/10",
  "patientDetails.lifestyleStress": "Estresse: {{value}}/10",
  "patientDetails.lifestyleEnergy": "Energia: {{value}}/10",
  "patientDetails.lifestyleEmotionalSupport": "Apoio emocional: {{value}}/10",
  "patientDetails.lifestyleMood": "Humor: {{value}}",
  "patientDetails.lifestylePhysicalActivity": "Atividade física: {{value}}",
  "patientDetails.lifestylePhysicalActivityYes":
    "Atividade física regular: sim",
  "patientDetails.lifestylePhysicalActivityNo": "Atividade física regular: não",
  "patientDetails.lifestyleNoRelevantAlert": "Sem alerta emocional relevante",
  "patientDetails.lifestyleRiskAttention":
    "Maior atenção para estado emocional/rotina",
  "patientDetails.lifestyleWarnAttention":
    "Atenção para fatores de estilo de vida",
  "patientDetails.riskNoEvolution": "Sem evolução registrada",
  "patientDetails.riskLongGap": "Longo intervalo sem sessão (14+ dias)",
  "patientDetails.riskMediumGap": "Intervalo elevado sem sessão (7+ dias)",
  "patientDetails.riskLowAdherence": "Aderência baixa nos últimos 28 dias",
  "patientDetails.riskMediumAdherence":
    "Aderência moderada nos últimos 28 dias",
  "patientDetails.riskHighStress": "Estresse elevado na anamnese",
  "patientDetails.riskLowEnergy": "Baixa energia no dia a dia",
  "patientDetails.riskLowSupport": "Baixo apoio emocional/social",
  "patientDetails.riskPoorSleep": "Sono com baixa qualidade",
  "patientDetails.contextGoalHint":
    "Considere alinhar a condução à meta principal: {{value}}.",
  "patientDetails.contextLimitationsHint":
    "Priorize condutas voltadas às limitações funcionais relatadas.",
  "patientDetails.nextActionCheckinTitle": "Enviar lembrete de check-in",
  "patientDetails.nextActionCheckinVulnerableDescription":
    "Há sinais de vulnerabilidade emocional/rotina. Faça um contato acolhedor e incentive um check-in breve para entender como o paciente está.",
  "patientDetails.nextActionCheckinDescription":
    "Paciente com intervalo recente sem sessão. Reforce o check-in para retomar o acompanhamento.",
  "patientDetails.nextActionAdherenceTitle": "Reforçar aderência",
  "patientDetails.nextActionAdherenceDescription":
    "Aderência abaixo do ideal. Envie uma mensagem rápida para aumentar consistência nesta semana.",
  "patientDetails.nextActionScheduleTitle": "Agendar retorno",
  "patientDetails.nextActionScheduleVulnerableDescription":
    "Há sinais importantes de sobrecarga emocional/rotina. Priorize contato para acolhimento e revisão do plano antes da perda de vínculo.",
  "patientDetails.nextActionScheduleDescription":
    "Risco alto de evasão por ausência prolongada. Priorize contato para revisar evolução e plano.",
  "patientDetails.nextActionReviewAdherenceTitle": "Revisar aderência e checks",
  "patientDetails.nextActionReviewAdherenceDescription":
    "Há sinais de queda de consistência. Confira a timeline de check-ins para agir com precisão.",
  "patientDetails.nextActionRecordEvolutionDescription":
    "Paciente está em acompanhamento adequado. Mantenha a cadência registrando evolução clínica.",
};

export const enPatientDetails: TranslationMap = {
  "patientDetails.notFound": "Patient not found",
  "patientDetails.whatsapp": "WhatsApp",
  "patientDetails.call": "Call",
  "patientDetails.email": "Email",
  "patientDetails.patientData": "Data",
  "patientDetails.personalData": "Personal Data",
  "patientDetails.cpf": "ID",
  "patientDetails.profession": "Profession",
  "patientDetails.contact": "Contact",
  "patientDetails.address": "Address",
  "patientDetails.addressLabel": "Address",
  "patientDetails.latestAnamneses": "Latest Anamneses",
  "patientDetails.noAnamnesis": "No anamnesis registered",
  "patientDetails.adherenceRetention": "Adherence and Retention",
  "patientDetails.adherence28": "Adherence (last 28 days)",
  "patientDetails.sessions28": "Sessions in the last 28 days: {{count}}/4",
  "patientDetails.lastSession": "Last session",
  "patientDetails.noEvolutionRegistered": "no evolution registered",
  "patientDetails.daysAgo": "{{days}} day(s) ago",
  "patientDetails.nextSuggestedSession": "Next suggested session",
  "patientDetails.dropoutRisk": "Dropout risk: {{risk}}",
  "patientDetails.quickMessages": "Quick Messages",
  "patientDetails.latestEvolutions": "Latest Evolutions",
  "patientDetails.noEvolution": "No evolution registered",
  "patientDetails.noAdjustments": "No clinical assessment",
  "patientDetails.adherenceChecks": "Adherence and Checks",
  "patientDetails.prescribeActivity": "Prescribe Activity",
  "patientDetails.recordEvolution": "Record Evolution",
  "patientDetails.readinessSummary": "Readiness summary",
  "patientDetails.readinessLinkTitle": "Patient has no app link",
  "patientDetails.readinessLinkDescription":
    "Link the patient in the app to unlock the full clinical flow.",
  "patientDetails.readinessLinkAction": "Link patient",
  "patientDetails.readinessAnamnesisTitle": "Ready to start anamnesis",
  "patientDetails.readinessAnamnesisDescription":
    "Recommended next step: fill out the anamnesis.",
  "patientDetails.readinessAnamnesisAction": "Continue flow · Anamnesis",
  "patientDetails.readinessPhysicalExamTitle": "Ready for physical exam",
  "patientDetails.readinessPhysicalExamDescription":
    "Anamnesis completed. Recommended next step: physical exam.",
  "patientDetails.readinessPhysicalExamAction": "Continue flow · Physical exam",
  "patientDetails.readinessEvolutionTitle": "Ready to record evolution",
  "patientDetails.readinessEvolutionDescription":
    "Physical exam completed. Recommended next step: evolution.",
  "patientDetails.readinessEvolutionAction": "Continue flow · Evolution",
  "patientDetails.readinessReportPlanTitle": "Ready for report and plan",
  "patientDetails.readinessReportPlanDescription":
    "Base flow completed. Generate report/plan to close the session.",
  "patientDetails.readinessReportPlanAction": "Continue flow · Report/Plan",
  "patientDetails.readinessPlanAction": "Continue flow · Plan",
  "patientDetails.readinessMonitoringTitle": "Session ready for closing",
  "patientDetails.readinessMonitoringDescription":
    "Clinical flow completed. Review adherence/check-ins and session pending items.",
  "patientDetails.readinessMonitoringAction": "Open adherence and checks",
  "patientDetails.clinicalFlowSteps": "Clinical flow in stages",
  "patientDetails.flowStatusDone": "Completed",
  "patientDetails.flowStatusInProgress": "In progress",
  "patientDetails.flowStatusPending": "Pending",
  "patientDetails.flowStatusNotStarted": "Not started",
  "patientDetails.noPermissionAnamnesis":
    "No permission to view this patient's anamneses",
  "patientDetails.loadAnamnesisError": "Could not load anamneses",
  "patientDetails.noPermissionEvolution":
    "No permission to view this patient's evolutions",
  "patientDetails.loadEvolutionError": "Could not load evolutions",
  "patientDetails.openWhatsappError": "Could not open WhatsApp",
  "patientDetails.guardCreateLinkBeforeAnamnesis":
    "Create the patient link before filling the anamnesis.",
  "patientDetails.guardCreateLinkFirst": "Create the patient link first.",
  "patientDetails.guardAnamnesisBeforePhysicalExam":
    "Record the anamnesis before opening the physical exam.",
  "patientDetails.guardAnamnesisBeforeEvolution":
    "Record the anamnesis before opening evolution.",
  "patientDetails.guardPhysicalExamBeforeEvolution":
    "Fill out the physical exam before recording evolution.",
  "patientDetails.guardLinkAndAnamnesisBeforeReport":
    "Record the anamnesis before opening the report.",
  "patientDetails.guardSaveReportBeforePlan":
    "Save the report before editing the plan",
  "patientDetails.notInformed": "Not informed",
  "patientDetails.sex": "Sex",
  "patientDetails.phone": "Phone",
  "patientDetails.neighborhood": "Neighborhood",
  "patientDetails.city": "City",
  "patientDetails.quickMessageCheckinLabel": "Check-in reminder",
  "patientDetails.quickMessageCheckinText":
    "Hi {{name}}, just a reminder for today's check-in in the app. If you need help, let me know.",
  "patientDetails.quickMessageAdherenceLabel": "Adherence reminder",
  "patientDetails.quickMessageAdherenceText":
    "Hi {{name}}, your consistency makes a difference in treatment. Try to keep this week's exercises.",
  "patientDetails.quickMessageScheduleLabel": "Schedule follow-up",
  "patientDetails.quickMessageScheduleText":
    "Hi {{name}}, let's schedule your follow-up to review progress and adjust the plan.",
  "patientDetails.quickMessageEmotionalSupportLabel": "Supportive check-in",
  "patientDetails.quickMessageEmotionalSupportText":
    "Hi {{name}}, I wanted to check how you've been feeling. If your routine has been difficult, let me know so we can adjust the plan with more comfort.",
  "patientDetails.quickMessageFunctionalGoalLabel": "Functional goal check-in",
  "patientDetails.quickMessageFunctionalGoalText":
    "Hi {{name}}, I want to align your exercise routine with your functional goal. Tell me how daily activities are going so we can adjust the plan.",
  "patientDetails.documentsExams": "Documents and Exams",
  "patientDetails.attachExam": "Attach exam",
  "patientDetails.loadingExams": "Loading exams...",
  "patientDetails.noExamsAttached": "No exam attached.",
  "patientDetails.openExam": "Open",
  "patientDetails.openingExam": "Opening...",
  "patientDetails.removeExam": "Remove",
  "patientDetails.removingExam": "Removing...",
  "patientDetails.examUploadedSuccess": "Exam attached successfully.",
  "patientDetails.examUploadInvalidFile": "Invalid file for upload.",
  "patientDetails.examUploadError": "Could not attach exam.",
  "patientDetails.examsLoadError": "Could not load attached exams.",
  "patientDetails.examOpenError": "Failed to open exam. Please try again.",
  "patientDetails.examErrorNetwork":
    "No stable connection. Check your internet and try again.",
  "patientDetails.examErrorSessionExpired":
    "Session expired. Please sign in again.",
  "patientDetails.examErrorForbidden":
    "You do not have permission to access this exam.",
  "patientDetails.examErrorNotFound": "Exam not found or already removed.",
  "patientDetails.examErrorTooLarge": "File too large. Maximum size is 10 MB.",
  "patientDetails.examErrorUnsupportedType":
    "Unsupported file type. Upload a PDF or image.",
  "patientDetails.examErrorInvalidData":
    "Invalid exam data. Review the file and try again.",
  "patientDetails.examErrorRateLimit":
    "Too many attempts. Wait a few seconds and try again.",
  "patientDetails.examErrorServer":
    "Service unavailable right now. Please try again.",
  "patientDetails.examRemoveSuccess": "Exam removed.",
  "patientDetails.examRemoveError": "Could not remove exam.",
  "patientDetails.openExamDialogTitle": "Open exam",
  "patientDetails.releaseAnamnesis": "Enable anamnesis",
  "patientDetails.blockAnamnesis": "Disable anamnesis",
  "patientDetails.anamnesisPermissionEnabled":
    "Anamnesis form enabled for the patient.",
  "patientDetails.anamnesisPermissionDisabled":
    "Anamnesis form not yet enabled for the patient.",
  "patientDetails.anamnesisPermissionUpdateError":
    "Could not update anamnesis permission.",
  "patientDetails.ananesisPermissionEnabled":
    "Anamnesis form enabled for the patient.",
  "patientDetails.ananesisPermissionDisabled":
    "Anamnesis form not yet enabled for the patient.",
  "patientDetails.ananesisPermissionUpdateError":
    "Could not update anamnesis permission.",
  "patientDetails.ananmesisPermissionEnabled":
    "Anamnesis form enabled for the patient.",
  "patientDetails.ananmesisPermissionDisabled":
    "Anamnesis form not yet enabled for the patient.",
  "patientDetails.ananmesisPermissionUpdateError":
    "Could not update anamnesis permission.",
  "patientDetails.updating": "Updating...",
  "patientDetails.appAccessLinkWarning":
    "Patient has no app access link. Link an email to unlock patient resources.",
  "patientDetails.startHereTitle": "Start here",
  "patientDetails.startHereDescription":
    "Open the anamnesis form to record the patient's initial data.",
  "patientDetails.startHereAction": "Open anamnesis form",
  "patientDetails.caseSummary": "Case summary",
  "patientDetails.recentHistory": "Recent history",
  "patientDetails.anamnesis": "Anamnesis",
  "patientDetails.physicalExam": "Physical exam",
  "patientDetails.evolution": "Evolution",
  "patientDetails.report": "Report",
  "patientDetails.plan": "Plan",
  "patientDetails.documentsCount": "{{count}} attached file(s)",
  "patientDetails.latestDocument": "Latest: {{name}}",
  "patientDetails.attachedFileFallback": "attached file",
  "patientDetails.hideDocuments": "Hide documents",
  "patientDetails.showAllDocuments": "View all documents",
  "patientDetails.followUp": "Follow-up",
  "patientDetails.noSession": "No session",
  "patientDetails.adherence": "Adherence",
  "patientDetails.risk": "Risk",
  "patientDetails.recommendedAction": "Recommended action",
  "patientDetails.lastSupportiveContact": "Last supportive contact: {{date}}",
  "patientDetails.hideMessages": "Hide messages",
  "patientDetails.seekReasonExisting": "Existing symptom",
  "patientDetails.seekReasonPreventive": "Preventive",
  "patientDetails.mainComplaint": "Main complaint",
  "patientDetails.affectedAreas": "Affected areas",
  "patientDetails.painIntensityShort": "pain {{value}}/10",
  "patientDetails.limitations": "Limitations",
  "patientDetails.patientGoal": "Patient goal",
  "patientDetails.dateUnavailable": "date unavailable",
  "patientDetails.latestEvolution": "Latest evolution",
  "patientDetails.attention": "Attention",
  "patientDetails.summary": "Summary",
  "patientDetails.noClinicalSummary":
    "There is not enough anamnesis or evolution data to build a clinical summary yet.",
  "patientDetails.lifestyleSleep": "Sleep: {{value}}",
  "patientDetails.lifestyleSleepQuality": "Sleep quality: {{value}}/10",
  "patientDetails.lifestyleStress": "Stress: {{value}}/10",
  "patientDetails.lifestyleEnergy": "Energy: {{value}}/10",
  "patientDetails.lifestyleEmotionalSupport": "Emotional support: {{value}}/10",
  "patientDetails.lifestyleMood": "Mood: {{value}}",
  "patientDetails.lifestylePhysicalActivity": "Physical activity: {{value}}",
  "patientDetails.lifestylePhysicalActivityYes":
    "Regular physical activity: yes",
  "patientDetails.lifestylePhysicalActivityNo": "Regular physical activity: no",
  "patientDetails.lifestyleNoRelevantAlert": "No relevant emotional alert",
  "patientDetails.lifestyleRiskAttention":
    "More attention needed for emotional state/routine",
  "patientDetails.lifestyleWarnAttention": "Attention to lifestyle factors",
  "patientDetails.riskNoEvolution": "No evolution recorded",
  "patientDetails.riskLongGap": "Long interval without session (14+ days)",
  "patientDetails.riskMediumGap": "Elevated interval without session (7+ days)",
  "patientDetails.riskLowAdherence": "Low adherence in the last 28 days",
  "patientDetails.riskMediumAdherence":
    "Moderate adherence in the last 28 days",
  "patientDetails.riskHighStress": "High stress in anamnesis",
  "patientDetails.riskLowEnergy": "Low daily energy",
  "patientDetails.riskLowSupport": "Low emotional/social support",
  "patientDetails.riskPoorSleep": "Poor sleep quality",
  "patientDetails.contextGoalHint":
    "Consider aligning care to the main goal: {{value}}.",
  "patientDetails.contextLimitationsHint":
    "Prioritize interventions aimed at the reported functional limitations.",
  "patientDetails.nextActionCheckinTitle": "Send check-in reminder",
  "patientDetails.nextActionCheckinVulnerableDescription":
    "There are signs of emotional/routine vulnerability. Make a supportive contact and encourage a brief check-in to understand how the patient is doing.",
  "patientDetails.nextActionCheckinDescription":
    "Patient has a recent interval without session. Reinforce check-in to resume follow-up.",
  "patientDetails.nextActionAdherenceTitle": "Reinforce adherence",
  "patientDetails.nextActionAdherenceDescription":
    "Adherence is below target. Send a quick message to increase consistency this week.",
  "patientDetails.nextActionScheduleTitle": "Schedule follow-up",
  "patientDetails.nextActionScheduleVulnerableDescription":
    "There are important signs of emotional/routine overload. Prioritize supportive contact and plan review before loss of engagement.",
  "patientDetails.nextActionScheduleDescription":
    "High dropout risk due to prolonged absence. Prioritize contact to review evolution and plan.",
  "patientDetails.nextActionReviewAdherenceTitle":
    "Review adherence and checks",
  "patientDetails.nextActionReviewAdherenceDescription":
    "There are signs of declining consistency. Check the check-in timeline to act precisely.",
  "patientDetails.nextActionRecordEvolutionDescription":
    "Patient is following up appropriately. Keep cadence by recording clinical evolution.",
};

export const esPatientDetails: TranslationMap = {
  "patientDetails.notFound": "Paciente no encontrado",
  "patientDetails.whatsapp": "WhatsApp",
  "patientDetails.call": "Llamar",
  "patientDetails.email": "Correo",
  "patientDetails.patientData": "Datos",
  "patientDetails.personalData": "Datos Personales",
  "patientDetails.cpf": "CPF",
  "patientDetails.profession": "Profesión",
  "patientDetails.contact": "Contacto",
  "patientDetails.address": "Dirección",
  "patientDetails.addressLabel": "Dirección",
  "patientDetails.latestAnamneses": "Últimas Anamnesis",
  "patientDetails.noAnamnesis": "No hay anamnesis registradas",
  "patientDetails.adherenceRetention": "Adherencia y Retención",
  "patientDetails.adherence28": "Adherencia (últimos 28 días)",
  "patientDetails.sessions28": "Sesiones en los últimos 28 días: {{count}}/4",
  "patientDetails.lastSession": "Última sesión",
  "patientDetails.noEvolutionRegistered": "sin evolución registrada",
  "patientDetails.daysAgo": "hace {{days}} día(s)",
  "patientDetails.nextSuggestedSession": "Próxima sesión sugerida",
  "patientDetails.dropoutRisk": "Riesgo de abandono: {{risk}}",
  "patientDetails.quickMessages": "Mensajes Rápidos",
  "patientDetails.latestEvolutions": "Últimas Evoluciones",
  "patientDetails.noEvolution": "No hay evolución registrada",
  "patientDetails.noAdjustments": "Sin evaluación clínica",
  "patientDetails.adherenceChecks": "Adherencia y Checks",
  "patientDetails.prescribeActivity": "Prescribir Actividad",
  "patientDetails.recordEvolution": "Registrar Evolución",
  "patientDetails.readinessSummary": "Resumen de preparación",
  "patientDetails.readinessLinkTitle": "Paciente sin vínculo de app",
  "patientDetails.readinessLinkDescription":
    "Vincula el paciente en la app para liberar el flujo clínico completo.",
  "patientDetails.readinessLinkAction": "Vincular paciente",
  "patientDetails.readinessAnamnesisTitle": "Listo para iniciar anamnesis",
  "patientDetails.readinessAnamnesisDescription":
    "Próximo paso recomendado: completar la anamnesis.",
  "patientDetails.readinessAnamnesisAction": "Continuar flujo · Anamnesis",
  "patientDetails.readinessPhysicalExamTitle": "Listo para examen físico",
  "patientDetails.readinessPhysicalExamDescription":
    "Anamnesis concluida. Próximo paso recomendado: examen físico.",
  "patientDetails.readinessPhysicalExamAction":
    "Continuar flujo · Examen físico",
  "patientDetails.readinessEvolutionTitle": "Listo para registrar evolución",
  "patientDetails.readinessEvolutionDescription":
    "Examen físico concluido. Próximo paso recomendado: evolución.",
  "patientDetails.readinessEvolutionAction": "Continuar flujo · Evolución",
  "patientDetails.readinessReportPlanTitle": "Listo para informe y plan",
  "patientDetails.readinessReportPlanDescription":
    "Flujo base concluido. Genera informe/plan para cerrar la sesión.",
  "patientDetails.readinessReportPlanAction": "Continuar flujo · Informe/Plan",
  "patientDetails.readinessPlanAction": "Continuar flujo · Plan",
  "patientDetails.readinessMonitoringTitle": "Sesión lista para cierre",
  "patientDetails.readinessMonitoringDescription":
    "Flujo clínico concluido. Revisa adherencia/check-ins y pendientes de la sesión.",
  "patientDetails.readinessMonitoringAction": "Abrir adherencia y checks",
  "patientDetails.clinicalFlowSteps": "Flujo clínico por etapas",
  "patientDetails.flowStatusDone": "Completado",
  "patientDetails.flowStatusInProgress": "En curso",
  "patientDetails.flowStatusPending": "Pendiente",
  "patientDetails.flowStatusNotStarted": "No iniciado",
  "patientDetails.noPermissionAnamnesis":
    "Sin permiso para ver las anamnesis de este paciente",
  "patientDetails.loadAnamnesisError": "No se pudieron cargar las anamnesis",
  "patientDetails.noPermissionEvolution":
    "Sin permiso para ver las evoluciones de este paciente",
  "patientDetails.loadEvolutionError": "No se pudieron cargar las evoluciones",
  "patientDetails.openWhatsappError": "No se pudo abrir WhatsApp",
  "patientDetails.guardCreateLinkBeforeAnamnesis":
    "Crea el vínculo del paciente antes de completar la anamnesis.",
  "patientDetails.guardCreateLinkFirst":
    "Crea primero el vínculo del paciente.",
  "patientDetails.guardAnamnesisBeforePhysicalExam":
    "Registra la anamnesis antes de abrir el examen físico.",
  "patientDetails.guardAnamnesisBeforeEvolution":
    "Registra la anamnesis antes de abrir la evolución.",
  "patientDetails.guardPhysicalExamBeforeEvolution":
    "Completa el examen físico antes de registrar la evolución.",
  "patientDetails.guardLinkAndAnamnesisBeforeReport":
    "Registra la anamnesis antes de abrir el informe.",
  "patientDetails.guardSaveReportBeforePlan":
    "Guarda el informe antes de editar el plan",
  "patientDetails.notInformed": "No informado",
  "patientDetails.sex": "Sexo",
  "patientDetails.phone": "Teléfono",
  "patientDetails.neighborhood": "Barrio",
  "patientDetails.city": "Ciudad",
  "patientDetails.quickMessageCheckinLabel": "Recordatorio de check-in",
  "patientDetails.quickMessageCheckinText":
    "Hola {{name}}, paso para recordar tu check-in de hoy en la app. Si tienes dificultad, avísame.",
  "patientDetails.quickMessageAdherenceLabel": "Refuerzo de adherencia",
  "patientDetails.quickMessageAdherenceText":
    "Hola {{name}}, tu constancia hace diferencia en el tratamiento. Intenta mantener los ejercicios de esta semana.",
  "patientDetails.quickMessageScheduleLabel": "Agendar retorno",
  "patientDetails.quickMessageScheduleText":
    "Hola {{name}}, vamos a agendar tu retorno para revisar tu evolución y ajustar el plan.",
  "patientDetails.quickMessageEmotionalSupportLabel": "Contacto de apoyo",
  "patientDetails.quickMessageEmotionalSupportText":
    "Hola {{name}}, quería saber cómo te has estado sintiendo. Si mantener la rutina está difícil, cuéntame para ajustar el plan con más comodidad.",
  "patientDetails.quickMessageFunctionalGoalLabel": "Enfoque en meta funcional",
  "patientDetails.quickMessageFunctionalGoalText":
    "Hola {{name}}, quiero alinear tu rutina de ejercicios con tu meta funcional. Cuéntame cómo vas en las actividades del día a día para ajustar el plan.",
  "patientDetails.documentsExams": "Documentos y exámenes",
  "patientDetails.attachExam": "Adjuntar examen",
  "patientDetails.loadingExams": "Cargando exámenes...",
  "patientDetails.noExamsAttached": "No hay exámenes adjuntos.",
  "patientDetails.openExam": "Abrir",
  "patientDetails.openingExam": "Abriendo...",
  "patientDetails.removeExam": "Eliminar",
  "patientDetails.removingExam": "Eliminando...",
  "patientDetails.examUploadedSuccess": "Examen adjuntado con éxito.",
  "patientDetails.examUploadInvalidFile": "Archivo inválido para subir.",
  "patientDetails.examUploadError": "No se pudo adjuntar el examen.",
  "patientDetails.examsLoadError":
    "No se pudieron cargar los exámenes adjuntos.",
  "patientDetails.examOpenError":
    "No se pudo abrir el examen. Inténtalo nuevamente.",
  "patientDetails.examErrorNetwork":
    "Sin conexión estable. Verifica internet e inténtalo de nuevo.",
  "patientDetails.examErrorSessionExpired":
    "Sesión expirada. Inicia sesión nuevamente.",
  "patientDetails.examErrorForbidden":
    "Sin permiso para acceder a este examen.",
  "patientDetails.examErrorNotFound": "Examen no encontrado o ya eliminado.",
  "patientDetails.examErrorTooLarge":
    "Archivo demasiado grande. El límite es 10 MB.",
  "patientDetails.examErrorUnsupportedType":
    "Tipo de archivo no compatible. Envía PDF o imagen.",
  "patientDetails.examErrorInvalidData":
    "Datos del examen inválidos. Revisa el archivo e inténtalo de nuevo.",
  "patientDetails.examErrorRateLimit":
    "Demasiados intentos. Espera unos segundos e inténtalo de nuevo.",
  "patientDetails.examErrorServer":
    "Servicio no disponible en este momento. Inténtalo de nuevo.",
  "patientDetails.examRemoveSuccess": "Examen eliminado.",
  "patientDetails.examRemoveError": "No se pudo eliminar el examen.",
  "patientDetails.openExamDialogTitle": "Abrir examen",
  "patientDetails.releaseAnamnesis": "Habilitar anamnesis",
  "patientDetails.blockAnamnesis": "Bloquear anamnesis",
  "patientDetails.anamnesisPermissionEnabled":
    "Anamnesis habilitada para el paciente.",
  "patientDetails.anamnesisPermissionDisabled":
    "Anamnesis aún no habilitada para el paciente.",
  "patientDetails.anamnesisPermissionUpdateError":
    "No se pudo actualizar el permiso de anamnesis.",
  "patientDetails.ananesisPermissionEnabled":
    "Anamnesis habilitada para el paciente.",
  "patientDetails.ananesisPermissionDisabled":
    "Anamnesis aún no habilitada para el paciente.",
  "patientDetails.ananesisPermissionUpdateError":
    "No se pudo actualizar el permiso de anamnesis.",
  "patientDetails.ananmesisPermissionEnabled":
    "Anamnesis habilitada para el paciente.",
  "patientDetails.ananmesisPermissionDisabled":
    "Anamnesis aún no habilitada para el paciente.",
  "patientDetails.ananmesisPermissionUpdateError":
    "No se pudo actualizar el permiso de anamnesis.",
  "patientDetails.updating": "Actualizando...",
  "patientDetails.appAccessLinkWarning":
    "Paciente sin vínculo de acceso a la app. Vincula un correo para liberar los recursos del paciente.",
  "patientDetails.startHereTitle": "Empezar por aquí",
  "patientDetails.startHereDescription":
    "Abre la ficha de anamnesis para registrar los datos iniciales del paciente.",
  "patientDetails.startHereAction": "Abrir ficha de anamnesis",
  "patientDetails.caseSummary": "Resumen del caso",
  "patientDetails.recentHistory": "Historial reciente",
  "patientDetails.anamnesis": "Anamnesis",
  "patientDetails.physicalExam": "Examen físico",
  "patientDetails.evolution": "Evolución",
  "patientDetails.report": "Informe",
  "patientDetails.plan": "Plan",
  "patientDetails.documentsCount": "{{count}} archivo(s) adjunto(s)",
  "patientDetails.latestDocument": "Último: {{name}}",
  "patientDetails.attachedFileFallback": "archivo adjunto",
  "patientDetails.hideDocuments": "Ocultar documentos",
  "patientDetails.showAllDocuments": "Ver todos los documentos",
  "patientDetails.followUp": "Seguimiento",
  "patientDetails.noSession": "Sin sesión",
  "patientDetails.adherence": "Adherencia",
  "patientDetails.risk": "Riesgo",
  "patientDetails.recommendedAction": "Acción recomendada",
  "patientDetails.lastSupportiveContact": "Último contacto de apoyo: {{date}}",
  "patientDetails.hideMessages": "Ocultar mensajes",
  "patientDetails.seekReasonExisting": "Síntoma existente",
  "patientDetails.seekReasonPreventive": "Preventivo",
  "patientDetails.mainComplaint": "Queja principal",
  "patientDetails.affectedAreas": "Áreas afectadas",
  "patientDetails.painIntensityShort": "dolor {{value}}/10",
  "patientDetails.limitations": "Limitaciones",
  "patientDetails.patientGoal": "Meta del paciente",
  "patientDetails.dateUnavailable": "fecha no disponible",
  "patientDetails.latestEvolution": "Última evolución",
  "patientDetails.attention": "Atención",
  "patientDetails.summary": "Resumen",
  "patientDetails.noClinicalSummary":
    "Aún no hay anamnesis o evolución suficiente para montar un resumen clínico.",
  "patientDetails.lifestyleSleep": "Sueño: {{value}}",
  "patientDetails.lifestyleSleepQuality": "Calidad del sueño: {{value}}/10",
  "patientDetails.lifestyleStress": "Estrés: {{value}}/10",
  "patientDetails.lifestyleEnergy": "Energía: {{value}}/10",
  "patientDetails.lifestyleEmotionalSupport": "Apoyo emocional: {{value}}/10",
  "patientDetails.lifestyleMood": "Humor: {{value}}",
  "patientDetails.lifestylePhysicalActivity": "Actividad física: {{value}}",
  "patientDetails.lifestylePhysicalActivityYes": "Actividad física regular: sí",
  "patientDetails.lifestylePhysicalActivityNo": "Actividad física regular: no",
  "patientDetails.lifestyleNoRelevantAlert": "Sin alerta emocional relevante",
  "patientDetails.lifestyleRiskAttention":
    "Mayor atención al estado emocional/rutina",
  "patientDetails.lifestyleWarnAttention":
    "Atención a factores de estilo de vida",
  "patientDetails.riskNoEvolution": "Sin evolución registrada",
  "patientDetails.riskLongGap": "Intervalo largo sin sesión (14+ días)",
  "patientDetails.riskMediumGap": "Intervalo elevado sin sesión (7+ días)",
  "patientDetails.riskLowAdherence": "Adherencia baja en los últimos 28 días",
  "patientDetails.riskMediumAdherence":
    "Adherencia moderada en los últimos 28 días",
  "patientDetails.riskHighStress": "Estrés elevado en la anamnesis",
  "patientDetails.riskLowEnergy": "Baja energía diaria",
  "patientDetails.riskLowSupport": "Bajo apoyo emocional/social",
  "patientDetails.riskPoorSleep": "Sueño de baja calidad",
  "patientDetails.contextGoalHint":
    "Considera alinear la conducta con la meta principal: {{value}}.",
  "patientDetails.contextLimitationsHint":
    "Prioriza conductas orientadas a las limitaciones funcionales reportadas.",
  "patientDetails.nextActionCheckinTitle": "Enviar recordatorio de check-in",
  "patientDetails.nextActionCheckinVulnerableDescription":
    "Hay señales de vulnerabilidad emocional/rutina. Haz un contacto de apoyo e incentiva un check-in breve para entender cómo está el paciente.",
  "patientDetails.nextActionCheckinDescription":
    "Paciente con intervalo reciente sin sesión. Refuerza el check-in para retomar el seguimiento.",
  "patientDetails.nextActionAdherenceTitle": "Reforzar adherencia",
  "patientDetails.nextActionAdherenceDescription":
    "Adherencia por debajo de lo ideal. Envía un mensaje rápido para aumentar la constancia esta semana.",
  "patientDetails.nextActionScheduleTitle": "Agendar retorno",
  "patientDetails.nextActionScheduleVulnerableDescription":
    "Hay señales importantes de sobrecarga emocional/rutina. Prioriza contacto de apoyo y revisión del plan antes de perder el vínculo.",
  "patientDetails.nextActionScheduleDescription":
    "Riesgo alto de abandono por ausencia prolongada. Prioriza contacto para revisar evolución y plan.",
  "patientDetails.nextActionReviewAdherenceTitle":
    "Revisar adherencia y checks",
  "patientDetails.nextActionReviewAdherenceDescription":
    "Hay señales de caída de constancia. Revisa la línea de tiempo de check-ins para actuar con precisión.",
  "patientDetails.nextActionRecordEvolutionDescription":
    "Paciente en seguimiento adecuado. Mantén la cadencia registrando evolución clínica.",
};
