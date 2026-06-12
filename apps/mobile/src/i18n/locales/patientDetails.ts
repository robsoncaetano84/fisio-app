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
  "patientDetails.readinessLinkTitle": "Paciente sem acesso ao app",
  "patientDetails.readinessLinkDescription":
    "Envie o acesso para o paciente acompanhar atividades, exames e documentos pelo app.",
  "patientDetails.readinessLinkAction": "Configurar acesso",
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
  "patientDetails.quickMessageFirstAppointmentLabel":
    "Agendar primeira consulta",
  "patientDetails.quickMessageFirstAppointmentText":
    "Oi {{name}}, vamos agendar sua primeira consulta para iniciar o acompanhamento e definir o plano com segurança.",
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
    "Paciente sem acesso ao app. Envie um convite para liberar acompanhamento, checks e documentos publicados.",
  "patientAppAccess.title": "Acesso do paciente ao app",
  "patientAppAccess.statusActive": "Acesso app ativo",
  "patientAppAccess.statusInvited": "Convite enviado",
  "patientAppAccess.statusExpired": "Convite expirado",
  "patientAppAccess.statusConflict": "Conflito de vínculo",
  "patientAppAccess.statusMissing": "Sem acesso ao app",
  "patientAppAccess.acceptedAt": "Aceito em {{date}}",
  "patientAppAccess.sentAt": "Enviado em {{date}}",
  "patientAppAccess.expiresAt": "Válido até {{date}}",
  "patientAppAccess.expiredAt": "Expirou em {{date}}",
  "patientAppAccess.activeDescription":
    "O paciente já pode acessar acompanhamento, checks, exames e documentos publicados.",
  "patientAppAccess.pendingDescription":
    "Aguardando o paciente aceitar o convite.",
  "patientAppAccess.expiredDescription":
    "O convite expirou. Gere um novo link antes de enviar novamente.",
  "patientAppAccess.conflictDescription":
    "Este cadastro tem conflito de vínculo. Revise o paciente antes de enviar novo acesso.",
  "patientAppAccess.missingDescription":
    "Envie o convite para o paciente acompanhar atividades, exames e documentos pelo app.",
  "patientAppAccess.manageInvite": "Gerenciar convite",
  "patientAppAccess.accessCenterDescription":
    "Centralize o envio, QR code, cópia do link e controle de vínculo do paciente.",
  "patientAppAccess.statusPanelTitle": "Status do vínculo",
  "patientAppAccess.qrTitle": "QR code do convite",
  "patientAppAccess.qrHint":
    "Mostre este QR code ao paciente ou envie o mesmo link pelos atalhos abaixo.",
  "patientAppAccess.qrEmptyTitle": "Nenhum link gerado nesta tela",
  "patientAppAccess.qrEmptyDescription":
    "Gere um link novo para exibir QR code, copiar ou enviar ao paciente.",
  "patientAppAccess.generateLink": "Gerar link",
  "patientAppAccess.deliveryTitle": "Envio ao paciente",
  "patientAppAccess.whatsappDirectDescription":
    "Abre a conversa do paciente com a mensagem pronta.",
  "patientAppAccess.whatsappGenericDescription":
    "Abre o WhatsApp para escolher o contato.",
  "patientAppAccess.shareDescription":
    "Envia por qualquer aplicativo disponível no dispositivo.",
  "patientAppAccess.copyMessageDescription":
    "Copia a mensagem completa com saudação, e-mail e link.",
  "patientAppAccess.copyLinkDescription":
    "Copia somente o link para colar onde preferir.",
  "patientAppAccess.securityTitle": "Controle do acesso",
  "patientAppAccess.revokeDescription":
    "Cancela o convite pendente sem remover dados do paciente.",
  "patientAppAccess.unlinkDescription":
    "Remove o acesso app ativo e permite um novo convite depois.",
  "patientAppAccess.noHistory": "Nenhum evento de acesso registrado.",
  "patientAppAccess.sendInvite": "Enviar convite",
  "patientAppAccess.resendInvite": "Reenviar convite",
  "patientAppAccess.copyInvite": "Copiar convite",
  "patientAppAccess.copyMessage": "Copiar mensagem",
  "patientAppAccess.copyLink": "Copiar link",
  "patientAppAccess.shareInvite": "Compartilhar",
  "patientAppAccess.sendWhatsapp": "Enviar pelo WhatsApp",
  "patientAppAccess.refreshStatus": "Atualizar status",
  "patientAppAccess.unlinkAction": "Desvincular acesso",
  "patientAppAccess.unlinkTitle": "Desvincular acesso ao app",
  "patientAppAccess.unlinkMessage":
    "O paciente deixará de acessar este acompanhamento até aceitar um novo convite.",
  "patientAppAccess.unlinkConfirm": "Desvincular",
  "patientAppAccess.unlinkSuccess": "Acesso removido com sucesso.",
  "patientAppAccess.revokeTitle": "Revogar convite",
  "patientAppAccess.revokeMessage":
    "O link enviado deixará de ser aceito. Você poderá gerar um novo convite depois.",
  "patientAppAccess.revokeConfirm": "Revogar",
  "patientAppAccess.revokeSuccess": "Convite revogado com sucesso.",
  "patientAppAccess.inviteReady": "Convite pronto para envio.",
  "patientAppAccess.linkGenerated": "Link gerado com sucesso.",
  "patientAppAccess.linkCopied": "Convite copiado.",
  "patientAppAccess.messageCopied": "Mensagem copiada.",
  "patientAppAccess.rawLinkCopied": "Link copiado.",
  "patientAppAccess.messageReady": "Mensagem pronta para envio.",
  "patientAppAccess.statusUpdated": "Status atualizado.",
  "patientAppAccess.inviteGreeting": "Olá, {{name}}.",
  "patientAppAccess.inviteIntro":
    "Você recebeu um convite para acessar sua área no Synap.",
  "patientAppAccess.inviteEmailHint": "Use este e-mail no cadastro: {{email}}",
  "patientAppAccess.inviteLink": "Link de acesso: {{link}}",
  "patientAppAccess.historyTitle": "Histórico do acesso",
  "patientAppAccess.event.INVITE_SENT": "Convite enviado",
  "patientAppAccess.event.INVITE_RESENT": "Convite reenviado",
  "patientAppAccess.event.INVITE_ACCEPTED": "Convite aceito",
  "patientAppAccess.event.INVITE_REVOKED": "Convite revogado",
  "patientAppAccess.event.ACCESS_UNLINKED": "Acesso desvinculado",
  "careTimeline.title": "Linha do cuidado",
  "careTimeline.patient.subtitle":
    "Veja onde você está no acompanhamento e qual etapa vem a seguir.",
  "careTimeline.professional.subtitle":
    "Acompanhe o caminho compartilhado entre app do paciente e fluxo clínico.",
  "careTimeline.stage.app_access": "Acesso ao app",
  "careTimeline.stage.anamnese": "Anamnese",
  "careTimeline.stage.exame_medico": "Avaliação e exames",
  "careTimeline.stage.evolucao": "Evolução",
  "careTimeline.stage.plano_laudo": "Plano e laudo",
  "careTimeline.stage.checkin": "Check-ins",
  "careTimeline.patient.status.DONE": "Etapa concluída no acompanhamento.",
  "careTimeline.patient.status.CURRENT": "Próxima ação recomendada para você.",
  "careTimeline.patient.status.WAITING":
    "Aguardando liberação ou revisão do profissional.",
  "careTimeline.patient.status.PENDING":
    "Será liberado conforme o acompanhamento avançar.",
  "careTimeline.professional.status.DONE": "Etapa concluída.",
  "careTimeline.professional.status.CURRENT":
    "Próxima ação recomendada para conduzir o caso.",
  "careTimeline.professional.status.WAITING":
    "Depende de resposta ou aceite do paciente.",
  "careTimeline.professional.status.PENDING":
    "Ficará disponível após as etapas anteriores.",
  "careTimeline.patient.action.SEND_INVITE": "Aguardar convite",
  "careTimeline.patient.action.FILL_ANAMNESE": "Preencher anamnese",
  "careTimeline.patient.action.WAIT_PROFESSIONAL": "Aguardar profissional",
  "careTimeline.patient.action.UPLOAD_EXAM": "Enviar exame",
  "careTimeline.patient.action.RECORD_EVOLUTION": "Aguardar evolução",
  "careTimeline.patient.action.PUBLISH_REPORT": "Aguardar publicação",
  "careTimeline.patient.action.DO_CHECKIN": "Fazer check-in",
  "careTimeline.patient.action.VIEW_DOCUMENTS": "Ver documentos",
  "careTimeline.professional.action.SEND_INVITE": "Enviar convite",
  "careTimeline.professional.action.FILL_ANAMNESE": "Abrir anamnese",
  "careTimeline.professional.action.WAIT_PROFESSIONAL": "Acompanhar liberação",
  "careTimeline.professional.action.UPLOAD_EXAM": "Anexar exame",
  "careTimeline.professional.action.RECORD_EVOLUTION": "Registrar evolução",
  "careTimeline.professional.action.PUBLISH_REPORT": "Abrir laudo",
  "careTimeline.professional.action.DO_CHECKIN": "Abrir checks",
  "careTimeline.professional.action.VIEW_DOCUMENTS": "Abrir adesão",
  "patientDetails.startHereTitle": "Vamos iniciar por aqui",
  "patientDetails.startHereDescription":
    "Abra a ficha de anamnese para registrar os dados iniciais do paciente.",
  "patientDetails.startHereAction": "Abrir ficha de anamnese",
  "patientDetails.caseSummary": "Resumo do caso",
  "patientDetails.recentHistory": "Histórico recente",
  "patientDetails.visibleAudit": "Auditoria do caso",
  "patientDetails.noVisibleAudit": "Nenhuma ação auditada para este caso.",
  "patientDetails.anamnesisReviewed": "Revisada pelo profissional",
  "patientDetails.anamnesisPendingReview": "Aguardando revisão profissional",
  "patientDetails.validateAnamnesisReview": "Validar revisão",
  "patientDetails.anamnesisReviewDefaultNote":
    "Anamnese preenchida pelo paciente revisada pelo profissional.",
  "patientDetails.anamnesisReviewedSuccess": "Anamnese revisada com sucesso.",
  "patientDetails.anamnesisReviewedError":
    "Não foi possível validar a revisão da anamnese.",
  "patientDetails.auditLaudoValidated": "Laudo validado",
  "patientDetails.auditLaudoPublished": "Laudo/plano publicado ao paciente",
  "patientDetails.auditAnamnesisReviewed":
    "Anamnese revisada pelo profissional",
  "patientDetails.auditPdfViewed": "PDF visualizado pelo paciente",
  "patientDetails.auditProfessionalPdf": "PDF aberto pelo profissional",
  "patientDetails.auditQuickMessage": "Mensagem rápida enviada",
  "patientDetails.auditPhysicalExamValidated": "Exame físico validado",
  "patientDetails.auditPlanValidated": "Plano validado",
  "patientDetails.auditCheckinSynced": "Check-in sincronizado",
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
  "patientDetails.sessionNotStarted": "Não iniciada",
  "patientDetails.daysWithoutSession": "{{days}} dia(s)",
  "patientDetails.adherenceNotMeasurable": "Sem plano ativo",
  "patientDetails.riskAwaitingData": "Aguardando dados",
  "patientDetails.followUpRecentPatientNote":
    "Cadastro recente. O risco de evasão será calculado após a primeira consulta registrada.",
  "patientDetails.followUpPendingFirstSessionNote":
    "Paciente ainda sem primeira consulta registrada. Acompanhe o início do cuidado antes de medir evasão.",
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
  "patientDetails.nextActionFirstAppointmentTitle": "Agendar primeira consulta",
  "patientDetails.nextActionFirstAppointmentRecentDescription":
    "Paciente recém-cadastrado e ainda sem primeira consulta registrada. Inicie o acompanhamento antes de medir risco de evasão.",
  "patientDetails.nextActionFirstAppointmentPendingDescription":
    "Paciente ainda sem primeira consulta registrada. Priorize o primeiro contato clínico para estabelecer plano e cadência.",
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
  "patientDetails.readinessLinkTitle": "Patient has no app access",
  "patientDetails.readinessLinkDescription":
    "Send app access so the patient can follow activities, exams, and published documents.",
  "patientDetails.readinessLinkAction": "Configure access",
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
  "patientDetails.quickMessageFirstAppointmentLabel":
    "Schedule first appointment",
  "patientDetails.quickMessageFirstAppointmentText":
    "Hi {{name}}, let's schedule your first appointment so we can start follow-up and define the plan safely.",
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
    "Patient has no app access. Send an invite to enable follow-up, check-ins, and published documents.",
  "patientAppAccess.title": "Patient app access",
  "patientAppAccess.statusActive": "App access active",
  "patientAppAccess.statusInvited": "Invite sent",
  "patientAppAccess.statusExpired": "Invite expired",
  "patientAppAccess.statusConflict": "Link conflict",
  "patientAppAccess.statusMissing": "No app access",
  "patientAppAccess.acceptedAt": "Accepted on {{date}}",
  "patientAppAccess.sentAt": "Sent on {{date}}",
  "patientAppAccess.expiresAt": "Valid until {{date}}",
  "patientAppAccess.expiredAt": "Expired on {{date}}",
  "patientAppAccess.activeDescription":
    "The patient can access follow-up, checks, exams, and published documents.",
  "patientAppAccess.pendingDescription":
    "Waiting for the patient to accept the invite.",
  "patientAppAccess.expiredDescription":
    "The invite has expired. Generate a new link before sending it again.",
  "patientAppAccess.conflictDescription":
    "This record has a link conflict. Review the patient before sending new access.",
  "patientAppAccess.missingDescription":
    "Send the invite so the patient can follow activities, exams, and documents in the app.",
  "patientAppAccess.manageInvite": "Manage invite",
  "patientAppAccess.accessCenterDescription":
    "Centralize delivery, QR code, link copy and patient access control.",
  "patientAppAccess.statusPanelTitle": "Access status",
  "patientAppAccess.qrTitle": "Invite QR code",
  "patientAppAccess.qrHint":
    "Show this QR code to the patient or send the same link using the actions below.",
  "patientAppAccess.qrEmptyTitle": "No link generated in this screen",
  "patientAppAccess.qrEmptyDescription":
    "Generate a new link to show a QR code, copy or send it to the patient.",
  "patientAppAccess.generateLink": "Generate link",
  "patientAppAccess.deliveryTitle": "Delivery to patient",
  "patientAppAccess.whatsappDirectDescription":
    "Opens the patient chat with the message ready.",
  "patientAppAccess.whatsappGenericDescription":
    "Opens WhatsApp so you can choose the contact.",
  "patientAppAccess.shareDescription":
    "Sends through any available app on the device.",
  "patientAppAccess.copyMessageDescription":
    "Copies the full message with greeting, email and link.",
  "patientAppAccess.copyLinkDescription":
    "Copies only the link to paste wherever needed.",
  "patientAppAccess.securityTitle": "Access control",
  "patientAppAccess.revokeDescription":
    "Cancels the pending invite without removing patient data.",
  "patientAppAccess.unlinkDescription":
    "Removes active app access and allows a new invite later.",
  "patientAppAccess.noHistory": "No access event recorded.",
  "patientAppAccess.sendInvite": "Send invite",
  "patientAppAccess.resendInvite": "Resend invite",
  "patientAppAccess.copyInvite": "Copy invite",
  "patientAppAccess.copyMessage": "Copy message",
  "patientAppAccess.copyLink": "Copy link",
  "patientAppAccess.shareInvite": "Share",
  "patientAppAccess.sendWhatsapp": "Send via WhatsApp",
  "patientAppAccess.refreshStatus": "Refresh status",
  "patientAppAccess.unlinkAction": "Unlink access",
  "patientAppAccess.unlinkTitle": "Unlink app access",
  "patientAppAccess.unlinkMessage":
    "The patient will stop accessing this follow-up until they accept a new invite.",
  "patientAppAccess.unlinkConfirm": "Unlink",
  "patientAppAccess.unlinkSuccess": "Access removed successfully.",
  "patientAppAccess.revokeTitle": "Revoke invite",
  "patientAppAccess.revokeMessage":
    "The sent link will no longer be accepted. You can generate a new invite later.",
  "patientAppAccess.revokeConfirm": "Revoke",
  "patientAppAccess.revokeSuccess": "Invite revoked successfully.",
  "patientAppAccess.inviteReady": "Invite ready to send.",
  "patientAppAccess.linkGenerated": "Link generated successfully.",
  "patientAppAccess.linkCopied": "Invite copied.",
  "patientAppAccess.messageCopied": "Message copied.",
  "patientAppAccess.rawLinkCopied": "Link copied.",
  "patientAppAccess.messageReady": "Message ready to send.",
  "patientAppAccess.statusUpdated": "Status updated.",
  "patientAppAccess.inviteGreeting": "Hello, {{name}}.",
  "patientAppAccess.inviteIntro":
    "You received an invite to access your area in Synap.",
  "patientAppAccess.inviteEmailHint": "Use this email to sign up: {{email}}",
  "patientAppAccess.inviteLink": "Access link: {{link}}",
  "patientAppAccess.historyTitle": "Access history",
  "patientAppAccess.event.INVITE_SENT": "Invite sent",
  "patientAppAccess.event.INVITE_RESENT": "Invite resent",
  "patientAppAccess.event.INVITE_ACCEPTED": "Invite accepted",
  "patientAppAccess.event.INVITE_REVOKED": "Invite revoked",
  "patientAppAccess.event.ACCESS_UNLINKED": "Access unlinked",
  "careTimeline.title": "Care timeline",
  "careTimeline.patient.subtitle":
    "See where you are in follow-up and what comes next.",
  "careTimeline.professional.subtitle":
    "Track the shared path between the patient app and the clinical flow.",
  "careTimeline.stage.app_access": "App access",
  "careTimeline.stage.anamnese": "Anamnesis",
  "careTimeline.stage.exame_medico": "Assessment and exams",
  "careTimeline.stage.evolucao": "Evolution",
  "careTimeline.stage.plano_laudo": "Plan and report",
  "careTimeline.stage.checkin": "Check-ins",
  "careTimeline.patient.status.DONE": "Step completed in follow-up.",
  "careTimeline.patient.status.CURRENT": "Recommended next action for you.",
  "careTimeline.patient.status.WAITING":
    "Waiting for professional release or review.",
  "careTimeline.patient.status.PENDING":
    "It will unlock as follow-up progresses.",
  "careTimeline.professional.status.DONE": "Step completed.",
  "careTimeline.professional.status.CURRENT":
    "Recommended next action to conduct the case.",
  "careTimeline.professional.status.WAITING":
    "Depends on patient response or acceptance.",
  "careTimeline.professional.status.PENDING":
    "It will become available after previous steps.",
  "careTimeline.patient.action.SEND_INVITE": "Wait for invite",
  "careTimeline.patient.action.FILL_ANAMNESE": "Fill anamnesis",
  "careTimeline.patient.action.WAIT_PROFESSIONAL": "Wait for professional",
  "careTimeline.patient.action.UPLOAD_EXAM": "Send exam",
  "careTimeline.patient.action.RECORD_EVOLUTION": "Wait for evolution",
  "careTimeline.patient.action.PUBLISH_REPORT": "Wait for publication",
  "careTimeline.patient.action.DO_CHECKIN": "Do check-in",
  "careTimeline.patient.action.VIEW_DOCUMENTS": "View documents",
  "careTimeline.professional.action.SEND_INVITE": "Send invite",
  "careTimeline.professional.action.FILL_ANAMNESE": "Open anamnesis",
  "careTimeline.professional.action.WAIT_PROFESSIONAL": "Track release",
  "careTimeline.professional.action.UPLOAD_EXAM": "Attach exam",
  "careTimeline.professional.action.RECORD_EVOLUTION": "Record evolution",
  "careTimeline.professional.action.PUBLISH_REPORT": "Open report",
  "careTimeline.professional.action.DO_CHECKIN": "Open checks",
  "careTimeline.professional.action.VIEW_DOCUMENTS": "Open adherence",
  "patientDetails.startHereTitle": "Start here",
  "patientDetails.startHereDescription":
    "Open the anamnesis form to record the patient's initial data.",
  "patientDetails.startHereAction": "Open anamnesis form",
  "patientDetails.caseSummary": "Case summary",
  "patientDetails.recentHistory": "Recent history",
  "patientDetails.visibleAudit": "Case audit",
  "patientDetails.noVisibleAudit": "No audited action for this case.",
  "patientDetails.anamnesisReviewed": "Reviewed by professional",
  "patientDetails.anamnesisPendingReview": "Waiting professional review",
  "patientDetails.validateAnamnesisReview": "Validate review",
  "patientDetails.anamnesisReviewDefaultNote":
    "Patient-filled anamnesis reviewed by the professional.",
  "patientDetails.anamnesisReviewedSuccess": "Anamnesis reviewed successfully.",
  "patientDetails.anamnesisReviewedError":
    "Could not validate the anamnesis review.",
  "patientDetails.auditLaudoValidated": "Report validated",
  "patientDetails.auditLaudoPublished": "Report/plan published to patient",
  "patientDetails.auditAnamnesisReviewed": "Anamnesis reviewed by professional",
  "patientDetails.auditPdfViewed": "PDF viewed by patient",
  "patientDetails.auditProfessionalPdf": "PDF opened by professional",
  "patientDetails.auditQuickMessage": "Quick message sent",
  "patientDetails.auditPhysicalExamValidated": "Physical exam validated",
  "patientDetails.auditPlanValidated": "Plan validated",
  "patientDetails.auditCheckinSynced": "Check-in synced",
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
  "patientDetails.sessionNotStarted": "Not started",
  "patientDetails.daysWithoutSession": "{{days}} day(s)",
  "patientDetails.adherenceNotMeasurable": "No active plan",
  "patientDetails.riskAwaitingData": "Awaiting data",
  "patientDetails.followUpRecentPatientNote":
    "Recent registration. Dropout risk will be calculated after the first recorded appointment.",
  "patientDetails.followUpPendingFirstSessionNote":
    "Patient has no first appointment recorded yet. Start care before measuring dropout risk.",
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
  "patientDetails.nextActionFirstAppointmentTitle":
    "Schedule first appointment",
  "patientDetails.nextActionFirstAppointmentRecentDescription":
    "Patient was recently registered and has no first appointment recorded yet. Start follow-up before measuring dropout risk.",
  "patientDetails.nextActionFirstAppointmentPendingDescription":
    "Patient has no first appointment recorded yet. Prioritize the first clinical contact to establish plan and cadence.",
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
  "patientDetails.readinessLinkTitle": "Paciente sin acceso a la app",
  "patientDetails.readinessLinkDescription":
    "Envía el acceso para que el paciente acompañe actividades, exámenes y documentos publicados en la app.",
  "patientDetails.readinessLinkAction": "Configurar acceso",
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
  "patientDetails.quickMessageFirstAppointmentLabel":
    "Agendar primera consulta",
  "patientDetails.quickMessageFirstAppointmentText":
    "Hola {{name}}, vamos a agendar tu primera consulta para iniciar el seguimiento y definir el plan con seguridad.",
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
    "Paciente sin acceso a la app. Envía una invitación para liberar seguimiento, checks y documentos publicados.",
  "patientAppAccess.title": "Acceso del paciente a la app",
  "patientAppAccess.statusActive": "Acceso app activo",
  "patientAppAccess.statusInvited": "Invitación enviada",
  "patientAppAccess.statusExpired": "Invitación expirada",
  "patientAppAccess.statusConflict": "Conflicto de vínculo",
  "patientAppAccess.statusMissing": "Sin acceso a la app",
  "patientAppAccess.acceptedAt": "Aceptado el {{date}}",
  "patientAppAccess.sentAt": "Enviado el {{date}}",
  "patientAppAccess.expiresAt": "Válido hasta {{date}}",
  "patientAppAccess.expiredAt": "Expiró el {{date}}",
  "patientAppAccess.activeDescription":
    "El paciente puede acceder a seguimiento, checks, exámenes y documentos publicados.",
  "patientAppAccess.pendingDescription":
    "Esperando que el paciente acepte la invitación.",
  "patientAppAccess.expiredDescription":
    "La invitación expiró. Genera un nuevo enlace antes de enviarla nuevamente.",
  "patientAppAccess.conflictDescription":
    "Este registro tiene conflicto de vínculo. Revisa el paciente antes de enviar nuevo acceso.",
  "patientAppAccess.missingDescription":
    "Envía la invitación para que el paciente acompañe actividades, exámenes y documentos en la app.",
  "patientAppAccess.manageInvite": "Gestionar invitación",
  "patientAppAccess.accessCenterDescription":
    "Centraliza el envío, QR code, copia del enlace y control de acceso del paciente.",
  "patientAppAccess.statusPanelTitle": "Estado del vínculo",
  "patientAppAccess.qrTitle": "QR code de la invitación",
  "patientAppAccess.qrHint":
    "Muestra este QR code al paciente o envía el mismo enlace con las acciones abajo.",
  "patientAppAccess.qrEmptyTitle": "Ningún enlace generado en esta pantalla",
  "patientAppAccess.qrEmptyDescription":
    "Genera un nuevo enlace para mostrar QR code, copiar o enviarlo al paciente.",
  "patientAppAccess.generateLink": "Generar enlace",
  "patientAppAccess.deliveryTitle": "Envío al paciente",
  "patientAppAccess.whatsappDirectDescription":
    "Abre la conversación del paciente con el mensaje listo.",
  "patientAppAccess.whatsappGenericDescription":
    "Abre WhatsApp para elegir el contacto.",
  "patientAppAccess.shareDescription":
    "Envía por cualquier app disponible en el dispositivo.",
  "patientAppAccess.copyMessageDescription":
    "Copia el mensaje completo con saludo, e-mail y enlace.",
  "patientAppAccess.copyLinkDescription":
    "Copia solo el enlace para pegarlo donde prefieras.",
  "patientAppAccess.securityTitle": "Control del acceso",
  "patientAppAccess.revokeDescription":
    "Cancela la invitación pendiente sin eliminar datos del paciente.",
  "patientAppAccess.unlinkDescription":
    "Elimina el acceso app activo y permite una nueva invitación después.",
  "patientAppAccess.noHistory": "Ningún evento de acceso registrado.",
  "patientAppAccess.sendInvite": "Enviar invitación",
  "patientAppAccess.resendInvite": "Reenviar invitación",
  "patientAppAccess.copyInvite": "Copiar invitación",
  "patientAppAccess.copyMessage": "Copiar mensaje",
  "patientAppAccess.copyLink": "Copiar enlace",
  "patientAppAccess.shareInvite": "Compartir",
  "patientAppAccess.sendWhatsapp": "Enviar por WhatsApp",
  "patientAppAccess.refreshStatus": "Actualizar estado",
  "patientAppAccess.unlinkAction": "Desvincular acceso",
  "patientAppAccess.unlinkTitle": "Desvincular acceso a la app",
  "patientAppAccess.unlinkMessage":
    "El paciente dejará de acceder a este seguimiento hasta aceptar una nueva invitación.",
  "patientAppAccess.unlinkConfirm": "Desvincular",
  "patientAppAccess.unlinkSuccess": "Acceso eliminado con éxito.",
  "patientAppAccess.revokeTitle": "Revocar invitación",
  "patientAppAccess.revokeMessage":
    "El enlace enviado dejará de ser aceptado. Podrás generar una nueva invitación después.",
  "patientAppAccess.revokeConfirm": "Revocar",
  "patientAppAccess.revokeSuccess": "Invitación revocada con éxito.",
  "patientAppAccess.inviteReady": "Invitación lista para enviar.",
  "patientAppAccess.linkGenerated": "Enlace generado con éxito.",
  "patientAppAccess.linkCopied": "Invitación copiada.",
  "patientAppAccess.messageCopied": "Mensaje copiado.",
  "patientAppAccess.rawLinkCopied": "Enlace copiado.",
  "patientAppAccess.messageReady": "Mensaje listo para enviar.",
  "patientAppAccess.statusUpdated": "Estado actualizado.",
  "patientAppAccess.inviteGreeting": "Hola, {{name}}.",
  "patientAppAccess.inviteIntro":
    "Recibiste una invitación para acceder a tu área en Synap.",
  "patientAppAccess.inviteEmailHint":
    "Usa este correo para registrarte: {{email}}",
  "patientAppAccess.inviteLink": "Enlace de acceso: {{link}}",
  "patientAppAccess.historyTitle": "Historial del acceso",
  "patientAppAccess.event.INVITE_SENT": "Invitación enviada",
  "patientAppAccess.event.INVITE_RESENT": "Invitación reenviada",
  "patientAppAccess.event.INVITE_ACCEPTED": "Invitación aceptada",
  "patientAppAccess.event.INVITE_REVOKED": "Invitación revocada",
  "patientAppAccess.event.ACCESS_UNLINKED": "Acceso desvinculado",
  "careTimeline.title": "Línea del cuidado",
  "careTimeline.patient.subtitle":
    "Mira dónde estás en el seguimiento y cuál etapa viene después.",
  "careTimeline.professional.subtitle":
    "Acompaña el camino compartido entre la app del paciente y el flujo clínico.",
  "careTimeline.stage.app_access": "Acceso a la app",
  "careTimeline.stage.anamnese": "Anamnesis",
  "careTimeline.stage.exame_medico": "Evaluación y exámenes",
  "careTimeline.stage.evolucao": "Evolución",
  "careTimeline.stage.plano_laudo": "Plan e informe",
  "careTimeline.stage.checkin": "Check-ins",
  "careTimeline.patient.status.DONE": "Etapa completada en el seguimiento.",
  "careTimeline.patient.status.CURRENT": "Próxima acción recomendada para ti.",
  "careTimeline.patient.status.WAITING":
    "Esperando liberación o revisión del profesional.",
  "careTimeline.patient.status.PENDING":
    "Se habilitará conforme avance el seguimiento.",
  "careTimeline.professional.status.DONE": "Etapa completada.",
  "careTimeline.professional.status.CURRENT":
    "Próxima acción recomendada para conducir el caso.",
  "careTimeline.professional.status.WAITING":
    "Depende de respuesta o aceptación del paciente.",
  "careTimeline.professional.status.PENDING":
    "Estará disponible después de las etapas anteriores.",
  "careTimeline.patient.action.SEND_INVITE": "Esperar invitación",
  "careTimeline.patient.action.FILL_ANAMNESE": "Completar anamnesis",
  "careTimeline.patient.action.WAIT_PROFESSIONAL": "Esperar profesional",
  "careTimeline.patient.action.UPLOAD_EXAM": "Enviar examen",
  "careTimeline.patient.action.RECORD_EVOLUTION": "Esperar evolución",
  "careTimeline.patient.action.PUBLISH_REPORT": "Esperar publicación",
  "careTimeline.patient.action.DO_CHECKIN": "Hacer check-in",
  "careTimeline.patient.action.VIEW_DOCUMENTS": "Ver documentos",
  "careTimeline.professional.action.SEND_INVITE": "Enviar invitación",
  "careTimeline.professional.action.FILL_ANAMNESE": "Abrir anamnesis",
  "careTimeline.professional.action.WAIT_PROFESSIONAL": "Acompañar liberación",
  "careTimeline.professional.action.UPLOAD_EXAM": "Adjuntar examen",
  "careTimeline.professional.action.RECORD_EVOLUTION": "Registrar evolución",
  "careTimeline.professional.action.PUBLISH_REPORT": "Abrir informe",
  "careTimeline.professional.action.DO_CHECKIN": "Abrir checks",
  "careTimeline.professional.action.VIEW_DOCUMENTS": "Abrir adherencia",
  "patientDetails.startHereTitle": "Empezar por aquí",
  "patientDetails.startHereDescription":
    "Abre la ficha de anamnesis para registrar los datos iniciales del paciente.",
  "patientDetails.startHereAction": "Abrir ficha de anamnesis",
  "patientDetails.caseSummary": "Resumen del caso",
  "patientDetails.recentHistory": "Historial reciente",
  "patientDetails.visibleAudit": "Auditoría del caso",
  "patientDetails.noVisibleAudit": "No hay acción auditada para este caso.",
  "patientDetails.anamnesisReviewed": "Revisada por el profesional",
  "patientDetails.anamnesisPendingReview": "Esperando revisión profesional",
  "patientDetails.validateAnamnesisReview": "Validar revisión",
  "patientDetails.anamnesisReviewDefaultNote":
    "Anamnesis completada por el paciente revisada por el profesional.",
  "patientDetails.anamnesisReviewedSuccess": "Anamnesis revisada con éxito.",
  "patientDetails.anamnesisReviewedError":
    "No fue posible validar la revisión de anamnesis.",
  "patientDetails.auditLaudoValidated": "Informe validado",
  "patientDetails.auditLaudoPublished": "Informe/plan publicado al paciente",
  "patientDetails.auditAnamnesisReviewed":
    "Anamnesis revisada por el profesional",
  "patientDetails.auditPdfViewed": "PDF visualizado por el paciente",
  "patientDetails.auditProfessionalPdf": "PDF abierto por el profesional",
  "patientDetails.auditQuickMessage": "Mensaje rápido enviado",
  "patientDetails.auditPhysicalExamValidated": "Examen físico validado",
  "patientDetails.auditPlanValidated": "Plan validado",
  "patientDetails.auditCheckinSynced": "Check-in sincronizado",
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
  "patientDetails.sessionNotStarted": "No iniciada",
  "patientDetails.daysWithoutSession": "{{days}} día(s)",
  "patientDetails.adherenceNotMeasurable": "Sin plan activo",
  "patientDetails.riskAwaitingData": "Esperando datos",
  "patientDetails.followUpRecentPatientNote":
    "Registro reciente. El riesgo de abandono se calculará después de la primera consulta registrada.",
  "patientDetails.followUpPendingFirstSessionNote":
    "Paciente aún sin primera consulta registrada. Inicia el cuidado antes de medir riesgo de abandono.",
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
  "patientDetails.nextActionFirstAppointmentTitle": "Agendar primera consulta",
  "patientDetails.nextActionFirstAppointmentRecentDescription":
    "Paciente registrado recientemente y aún sin primera consulta. Inicia el seguimiento antes de medir riesgo de abandono.",
  "patientDetails.nextActionFirstAppointmentPendingDescription":
    "Paciente aún sin primera consulta registrada. Prioriza el primer contacto clínico para establecer plan y cadencia.",
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
