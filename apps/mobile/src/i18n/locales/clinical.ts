// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// CLINICAL
// ==========================================
type TranslationMap = Record<string, string>;

export const ptClinical: TranslationMap = {
  "clinical.sections.anamnesis": "Anamnese",
  "clinical.sections.evolution": "Evolução",
  "clinical.sections.report": "Laudo",
  "clinical.sections.clinicalTemplate": "Template Clínico",
  "clinical.sections.functionalDiagnosis": "Diagnóstico Funcional",
  "clinical.sections.treatmentGoals": "Objetivos do Tratamento",
  "clinical.sections.carePlan": "Plano de Atendimento",
  "clinical.sections.treatmentPlanForm": "Plano de Tratamento",
  "clinical.sections.validationHistory": "Histórico de Validações",
  "clinical.sections.scientificReferencesSuggested":
    "Referências científicas sugeridas",
  "clinical.sections.scientificValidation": "Validação científica",
  "clinical.sections.targetedTherapeuticConduct": "Conduta terapêutica direcionada",
  "clinical.sections.clinicalPreview": "Prévia clínica",
  "clinical.actions.newAnamnesis": "Nova anamnese",
  "clinical.actions.newEvolution": "Nova evolução",
  "clinical.actions.recordEvolution": "Registrar evolução",
  "clinical.actions.saveDraft": "Salvar rascunho",
  "clinical.actions.clearDraft": "Limpar rascunho",
  "clinical.actions.openSource": "Abrir fonte",
  "clinical.actions.markAsConsulted": "Marcar como consultada",
  "clinical.actions.markedAsConsulted": "Marcada como consultada",
  "clinical.actions.applyTemplate": "Aplicar template",
  "clinical.actions.apply": "Aplicar",
  "clinical.actions.generateReportPdf": "Gerar Laudo (PDF)",
  "clinical.actions.generatePlanPdf": "Gerar PDF do Plano",
  "clinical.actions.saveReport": "Salvar Laudo",
  "clinical.actions.validateAndApprove": "Validar e Aprovar",
  "clinical.actions.reportValidated": "Laudo Validado",
  "clinical.actions.validateAnyway": "Validar mesmo assim",
  "clinical.actions.fillWithAi": "Preencher com IA",
  "clinical.actions.clearLocalDraft": "Limpar rascunho local",
  "clinical.actions.savePlan": "Salvar Plano",
  "clinical.actions.regenerateFromAnamnesis": "Regenerar por anamnese",
  "clinical.actions.recalculateReasoning": "Recalcular raciocínio",
  "clinical.actions.saveTriageAndRefer": "Salvar triagem e encaminhar",
  "clinical.actions.savePhysicalExam": "Salvar Exame Físico",
  "clinical.messages.clearDraftConfirm":
    "Tem certeza que deseja apagar o rascunho?",
  "clinical.messages.newReportAndPlan": "Novo laudo e plano",
  "clinical.messages.editReportAndPlan": "Editar laudo e plano",
  "clinical.messages.saveBeforeGeneratePdf": "Salve o laudo antes de gerar PDF",
  "clinical.messages.applyTemplateConfirm":
    'Deseja aplicar o template "{template}"? Isso substitui os campos atuais.',
  "clinical.messages.saved": "Registro salvo com sucesso",
  "clinical.messages.deleted": "Registro excluído com sucesso",
  "clinical.messages.aiSuggestionError":
    "Não foi possível gerar sugestão por IA.",
  "clinical.messages.fillAnamnesisBeforeSavingPlan":
    "Preencha a anamnese antes de salvar o plano.",
  "clinical.messages.reviewHighlightedFields":
    "Revise os campos destacados para continuar.",
  "clinical.messages.planSavedSuccessfully": "Plano salvo com sucesso.",
  "clinical.messages.fillAnamnesisBeforeSavingReport":
    "Preencha a anamnese antes de salvar o laudo.",
  "clinical.messages.criticalChangesApplied":
    "Mudanças críticas aplicadas. Revalide o laudo.",
  "clinical.messages.reportAndPlanSavedSuccessfully":
    "Laudo e plano salvos com sucesso",
  "clinical.messages.noPermissionSavePatientReport":
    "Sem permissão para salvar laudo deste paciente",
  "clinical.messages.patientNotFoundCurrentSession":
    "Paciente não encontrado para a sessão atual",
  "clinical.messages.saveReportBeforeValidation":
    "Salve o laudo antes de validar",
  "clinical.messages.saveChangesBeforeValidation":
    "Salve as alterações antes de validar o laudo",
  "clinical.messages.reportAlreadyValidated": "Este laudo já está validado",
  "clinical.messages.reportAndPlanValidatedSuccessfully":
    "Laudo e plano validados com sucesso",
  "clinical.messages.pdfGenerationError": "Não foi possível gerar o PDF",
  "clinical.messages.referenceOpenError":
    "Não foi possível abrir a referência",
  "clinical.messages.professionalNotesHint":
    "Anotações do profissional para ajustes antes da validação.",
  "clinical.messages.noValidationHistory":
    "Nenhuma validação registrada ainda.",
  "clinical.messages.noPermissionAccessPatient":
    "Sem permissão para acessar este paciente",
  "clinical.messages.noPermissionEditPlan":
    "Sem permissão para editar este plano.",
  "clinical.messages.planSaveError": "Não foi possível salvar o plano.",
  "clinical.messages.treatmentPlanFormSubtitle":
    "Formulário independente do laudo com sugestão inicial por IA.",
  "clinical.messages.lastEditedAt": "Última edição",
  "clinical.messages.applyInitialTemplateHint":
    "Aplique um modelo inicial e ajuste conforme o caso.",
  "clinical.messages.aiUsedExamReadings":
    "IA considerou leitura de {{total}} exame(s) de imagem anexado(s).",
  "clinical.messages.aiUsedExamMetadata":
    "IA considerou metadados de {{total}} exame(s) anexado(s).",
  "clinical.messages.scientificPdfTraceabilityHint":
    "No PDF profissional, a validação científica e as referências consultadas (quando marcadas) podem ser incluídas para rastreabilidade.",
  "clinical.messages.scientificReferencesValidationRecommended":
    "Referências sugeridas disponíveis. Consulte e marque pelo menos uma antes de validar (recomendado).",
  "clinical.messages.validateWithoutConsultedReferencesConfirm":
    "Há referências científicas sugeridas sem marcação de consulta. Deseja validar mesmo assim?",
  "clinical.messages.suggestedProfile": "Perfil sugerido",
  "clinical.messages.forReport": "Para o laudo",
  "clinical.messages.forTreatmentPlan": "Para o plano de tratamento",
  "clinical.messages.consultedSourcesCount": "Fontes consultadas",
  "clinical.messages.validatedByProfessional": "Validado pelo profissional",
  "clinical.messages.pendingValidationDraft": "Rascunho pendente de validação",
  "clinical.messages.criticalChangesDetectedRevalidation":
    "Mudanças críticas detectadas. Revalidação necessária.",
  "clinical.messages.unsavedChangesInReport":
    "Há alterações não salvas neste laudo",
  "clinical.messages.validatedAt": "Validado em",
  "clinical.messages.professionalValidationChecklistTitle":
    "Checklist de validação profissional",
  "clinical.messages.professionalValidationChecklistItem":
    "Revisei o laudo/plano, conferi a coerência clínica e assumo a validação profissional deste conteúdo.",
  "clinical.messages.validationChecklistRequired":
    "Confirme a validação profissional antes de aprovar o laudo.",
  "clinical.messages.pdfWithoutConsultedReferencesWarning":
    "PDF profissional gerado sem fontes consultadas marcadas. Recomendado revisar ao menos uma referência para rastreabilidade.",
  "clinical.labels.scientificTraceabilityPending":
    "Rastreabilidade científica pendente",
  "clinical.labels.pain": "Dor",
  "clinical.labels.intensity": "Intensidade",
  "clinical.labels.shortTerm": "Curto prazo",
  "clinical.labels.mediumTerm": "Médio prazo",
  "clinical.labels.shortTermGoals": "Objetivos de curto prazo",
  "clinical.labels.mediumTermGoals": "Objetivos de médio prazo",
  "clinical.labels.weeklyFrequency": "Frequência semanal",
  "clinical.labels.durationWeeks": "Duração (semanas)",
  "clinical.labels.phasedPlan": "Plano em fases",
  "clinical.labels.therapeuticConducts": "Condutas terapeuticas",
  "clinical.labels.physicalExam": "Exame físico",
  "clinical.labels.professionalDraft": "Rascunho do profissional",
  "clinical.labels.aiTreatmentPlan": "Plano de tratamento gerado por IA",
  "clinical.labels.dischargeCriteria": "Critérios de alta",
  "clinical.labels.observations": "Observações",
  "clinical.labels.guidelines": "Orientações",
  "clinical.labels.checkin": "Check-in",
  "clinical.labels.postSessionCheckin": "Check-in pós-sessão",
  "clinical.labels.activePrescriptions": "Prescrições ativas",
  "clinical.labels.references": "Referências",
  "clinical.templates.general": "Geral",
  "clinical.templates.lumbar": "Lombar",
  "clinical.templates.cervical": "Cervical",
  "clinical.templates.knee": "Joelho",
  "clinical.status.draft": "Rascunho",
  "clinical.status.validated": "Validado",
  "clinical.status.noSuggestedSources": "Sem fontes sugeridas",
  "clinical.status.pending": "Pendente",
  "clinical.status.partial": "Parcial",
  "clinical.status.completed": "Concluída",
  "clinical.status.revalidationPending": "Revalidação pendente",
  "clinical.status.notTested": "Não testado",
  "clinical.status.generating": "Gerando...",
  "clinical.placeholders.functionalDiagnosis":
    "Descreva o diagnóstico funcional",
  "clinical.placeholders.shortTermGoals":
    "Resultados esperados nas primeiras semanas",
  "clinical.placeholders.mediumTermGoals":
    "Resultados esperados em médio prazo",
  "clinical.placeholders.therapeuticConducts":
    "Exercícios, técnicas e condutas planejadas",
  "clinical.placeholders.phasedPlan": "Plano em fases/semanas",
  "clinical.placeholders.dischargeCriteria":
    "Defina os critérios para alta",
  "clinical.placeholders.dischargeCriteriaPatient":
    "Defina os critérios para alta do paciente",
  "clinical.placeholders.additionalObservations": "Observações adicionais",
  "clinical.placeholders.professionalDraftNotes":
    "Notas ou rascunho complementar do laudo",
  "clinical.validation.functionalDiagnosisRequired":
    "Diagnóstico funcional é obrigatório",
  "clinical.validation.shortTermRequired":
    "Informe o objetivo de curto prazo.",
  "clinical.validation.therapeuticConductRequired":
    "Descreva ao menos uma conduta terapêutica.",
  "clinical.validation.numberGreaterThanZero": "Use um número maior que 0.",
  "clinical.validation.weeklyFrequencyRange":
    "Frequência semanal deve ser entre 1 e 7",
  "clinical.validation.durationWeeksRange":
    "Duração em semanas deve ser entre 1 e 52",
  "clinical.validation.movementPainReproductionRequired":
    "Informe qual movimento reproduz a dor.",
  "clinical.validation.primaryHypothesisRequired":
    "Hipótese principal é obrigatória.",
  "clinical.validation.condutaDirectionRequired":
    "Direção de conduta é obrigatória.",
  "clinical.validation.neuralDetailedRequired":
    "Para lesão neural, preencha pelo menos um item do bloco neurológico detalhado.",
  "clinical.validation.atLeastOneRegionalTestRequired":
    "Marque pelo menos um teste regional como positivo ou negativo.",
  "clinical.validation.referralDestinationRequired":
    "Informe o destino de encaminhamento.",
  "clinical.validation.referralReasonRequired":
    "Descreva o motivo clínico do encaminhamento.",
};

export const enClinical: TranslationMap = {
  "clinical.sections.anamnesis": "Anamnesis",
  "clinical.sections.evolution": "Evolution",
  "clinical.sections.report": "Report",
  "clinical.sections.clinicalTemplate": "Clinical Template",
  "clinical.sections.functionalDiagnosis": "Functional Diagnosis",
  "clinical.sections.treatmentGoals": "Treatment Goals",
  "clinical.sections.carePlan": "Care Plan",
  "clinical.sections.treatmentPlanForm": "Treatment Plan",
  "clinical.sections.validationHistory": "Validation History",
  "clinical.sections.scientificReferencesSuggested":
    "Suggested scientific references",
  "clinical.sections.scientificValidation": "Scientific validation",
  "clinical.sections.targetedTherapeuticConduct": "Targeted therapeutic conduct",
  "clinical.sections.clinicalPreview": "Clinical preview",
  "clinical.actions.newAnamnesis": "New anamnesis",
  "clinical.actions.newEvolution": "New evolution",
  "clinical.actions.recordEvolution": "Record evolution",
  "clinical.actions.saveDraft": "Save draft",
  "clinical.actions.clearDraft": "Clear draft",
  "clinical.actions.openSource": "Open source",
  "clinical.actions.markAsConsulted": "Mark as consulted",
  "clinical.actions.markedAsConsulted": "Marked as consulted",
  "clinical.actions.applyTemplate": "Apply template",
  "clinical.actions.apply": "Apply",
  "clinical.actions.generateReportPdf": "Generate Report (PDF)",
  "clinical.actions.generatePlanPdf": "Generate Plan PDF",
  "clinical.actions.saveReport": "Save Report",
  "clinical.actions.validateAndApprove": "Validate and Approve",
  "clinical.actions.reportValidated": "Report Validated",
  "clinical.actions.validateAnyway": "Validate anyway",
  "clinical.actions.fillWithAi": "Fill with AI",
  "clinical.actions.clearLocalDraft": "Clear local draft",
  "clinical.actions.savePlan": "Save Plan",
  "clinical.actions.regenerateFromAnamnesis": "Regenerate from anamnesis",
  "clinical.actions.recalculateReasoning": "Recalculate reasoning",
  "clinical.actions.saveTriageAndRefer": "Save triage and refer",
  "clinical.actions.savePhysicalExam": "Save Physical Exam",
  "clinical.messages.clearDraftConfirm":
    "Are you sure you want to delete the draft?",
  "clinical.messages.newReportAndPlan": "New report and plan",
  "clinical.messages.editReportAndPlan": "Edit report and plan",
  "clinical.messages.saveBeforeGeneratePdf":
    "Save the report before generating the PDF",
  "clinical.messages.applyTemplateConfirm":
    'Apply the "{template}" template? This will replace the current fields.',
  "clinical.messages.saved": "Record saved successfully",
  "clinical.messages.deleted": "Record deleted successfully",
  "clinical.messages.aiSuggestionError":
    "Could not generate AI suggestion.",
  "clinical.messages.fillAnamnesisBeforeSavingPlan":
    "Fill anamnesis before saving the plan.",
  "clinical.messages.reviewHighlightedFields":
    "Review the highlighted fields to continue.",
  "clinical.messages.planSavedSuccessfully": "Plan saved successfully.",
  "clinical.messages.fillAnamnesisBeforeSavingReport":
    "Fill anamnesis before saving the report.",
  "clinical.messages.criticalChangesApplied":
    "Critical changes applied. Revalidate the report.",
  "clinical.messages.reportAndPlanSavedSuccessfully":
    "Report and plan saved successfully",
  "clinical.messages.noPermissionSavePatientReport":
    "No permission to save this patient's report",
  "clinical.messages.patientNotFoundCurrentSession":
    "Patient not found for the current session",
  "clinical.messages.saveReportBeforeValidation":
    "Save the report before validating",
  "clinical.messages.saveChangesBeforeValidation":
    "Save changes before validating the report",
  "clinical.messages.reportAlreadyValidated":
    "This report is already validated",
  "clinical.messages.reportAndPlanValidatedSuccessfully":
    "Report and plan validated successfully",
  "clinical.messages.pdfGenerationError": "Could not generate PDF",
  "clinical.messages.referenceOpenError":
    "Could not open the reference",
  "clinical.messages.professionalNotesHint":
    "Professional notes for adjustments before validation.",
  "clinical.messages.noValidationHistory":
    "No validation recorded yet.",
  "clinical.messages.noPermissionAccessPatient":
    "You do not have permission to access this patient",
  "clinical.messages.noPermissionEditPlan":
    "You do not have permission to edit this plan.",
  "clinical.messages.planSaveError": "Could not save the plan.",
  "clinical.messages.treatmentPlanFormSubtitle":
    "Independent treatment plan form with initial AI suggestion.",
  "clinical.messages.lastEditedAt": "Last edited",
  "clinical.messages.applyInitialTemplateHint":
    "Apply an initial template and adjust it to the case.",
  "clinical.messages.aiUsedExamReadings":
    "AI considered readings from {{total}} attached imaging exam(s).",
  "clinical.messages.aiUsedExamMetadata":
    "AI considered metadata from {{total}} attached exam(s).",
  "clinical.messages.scientificPdfTraceabilityHint":
    "In the professional PDF, scientific validation and consulted references (when marked) may be included for traceability.",
  "clinical.messages.scientificReferencesValidationRecommended":
    "Suggested references are available. Review and mark at least one before validating (recommended).",
  "clinical.messages.validateWithoutConsultedReferencesConfirm":
    "There are suggested scientific references without consultation marks. Validate anyway?",
  "clinical.messages.suggestedProfile": "Suggested profile",
  "clinical.messages.forReport": "For the report",
  "clinical.messages.forTreatmentPlan": "For the treatment plan",
  "clinical.messages.consultedSourcesCount": "Consulted sources",
  "clinical.messages.validatedByProfessional": "Validated by professional",
  "clinical.messages.pendingValidationDraft": "Draft pending validation",
  "clinical.messages.criticalChangesDetectedRevalidation":
    "Critical changes detected. Revalidation required.",
  "clinical.messages.unsavedChangesInReport":
    "There are unsaved changes in this report",
  "clinical.messages.validatedAt": "Validated at",
  "clinical.messages.professionalValidationChecklistTitle":
    "Professional validation checklist",
  "clinical.messages.professionalValidationChecklistItem":
    "I reviewed the report/plan, checked clinical consistency, and take professional responsibility for validating this content.",
  "clinical.messages.validationChecklistRequired":
    "Confirm professional validation before approving the report.",
  "clinical.messages.pdfWithoutConsultedReferencesWarning":
    "Professional PDF generated with no consulted references marked. It is recommended to review at least one reference for traceability.",
  "clinical.labels.scientificTraceabilityPending":
    "Scientific traceability pending",
  "clinical.labels.pain": "Pain",
  "clinical.labels.intensity": "Intensity",
  "clinical.labels.shortTerm": "Short term",
  "clinical.labels.mediumTerm": "Medium term",
  "clinical.labels.shortTermGoals": "Short-term goals",
  "clinical.labels.mediumTermGoals": "Medium-term goals",
  "clinical.labels.weeklyFrequency": "Weekly frequency",
  "clinical.labels.durationWeeks": "Duration (weeks)",
  "clinical.labels.phasedPlan": "Phased plan",
  "clinical.labels.therapeuticConducts": "Therapeutic conducts",
  "clinical.labels.physicalExam": "Physical exam",
  "clinical.labels.professionalDraft": "Professional draft",
  "clinical.labels.aiTreatmentPlan": "AI-generated treatment plan",
  "clinical.labels.dischargeCriteria": "Discharge criteria",
  "clinical.labels.observations": "Observations",
  "clinical.labels.guidelines": "Guidelines",
  "clinical.labels.checkin": "Check-in",
  "clinical.labels.postSessionCheckin": "Post-session check-in",
  "clinical.labels.activePrescriptions": "Active prescriptions",
  "clinical.labels.references": "References",
  "clinical.templates.general": "General",
  "clinical.templates.lumbar": "Lumbar",
  "clinical.templates.cervical": "Cervical",
  "clinical.templates.knee": "Knee",
  "clinical.status.draft": "Draft",
  "clinical.status.validated": "Validated",
  "clinical.status.noSuggestedSources": "No suggested sources",
  "clinical.status.pending": "Pending",
  "clinical.status.partial": "Partial",
  "clinical.status.completed": "Completed",
  "clinical.status.revalidationPending": "Revalidation pending",
  "clinical.status.notTested": "Not tested",
  "clinical.status.generating": "Generating...",
  "clinical.placeholders.functionalDiagnosis":
    "Describe the functional diagnosis",
  "clinical.placeholders.shortTermGoals":
    "Expected results in the first weeks",
  "clinical.placeholders.mediumTermGoals":
    "Expected medium-term results",
  "clinical.placeholders.therapeuticConducts":
    "Exercises, techniques and planned conducts",
  "clinical.placeholders.phasedPlan": "Plan by phases/weeks",
  "clinical.placeholders.dischargeCriteria":
    "Define discharge criteria",
  "clinical.placeholders.dischargeCriteriaPatient":
    "Define patient discharge criteria",
  "clinical.placeholders.additionalObservations": "Additional observations",
  "clinical.placeholders.professionalDraftNotes":
    "Notes or complementary report draft",
  "clinical.validation.functionalDiagnosisRequired":
    "Functional diagnosis is required",
  "clinical.validation.shortTermRequired": "Provide a short-term goal.",
  "clinical.validation.therapeuticConductRequired":
    "Describe at least one therapeutic conduct.",
  "clinical.validation.numberGreaterThanZero":
    "Use a number greater than 0.",
  "clinical.validation.weeklyFrequencyRange":
    "Weekly frequency must be between 1 and 7",
  "clinical.validation.durationWeeksRange":
    "Duration in weeks must be between 1 and 52",
  "clinical.validation.movementPainReproductionRequired":
    "Inform which movement reproduces the pain.",
  "clinical.validation.primaryHypothesisRequired":
    "Primary hypothesis is required.",
  "clinical.validation.condutaDirectionRequired":
    "Treatment direction is required.",
  "clinical.validation.neuralDetailedRequired":
    "For neural lesion, fill at least one field in the detailed neurological block.",
  "clinical.validation.atLeastOneRegionalTestRequired":
    "Mark at least one regional test as positive or negative.",
  "clinical.validation.referralDestinationRequired":
    "Inform the referral destination.",
  "clinical.validation.referralReasonRequired":
    "Describe the clinical reason for referral.",
};

export const esClinical: TranslationMap = {
  "clinical.sections.anamnesis": "Anamnesis",
  "clinical.sections.evolution": "Evolución",
  "clinical.sections.report": "Informe",
  "clinical.sections.clinicalTemplate": "Plantilla clínica",
  "clinical.sections.functionalDiagnosis": "Diagnóstico funcional",
  "clinical.sections.treatmentGoals": "Objetivos del tratamiento",
  "clinical.sections.carePlan": "Plan de atención",
  "clinical.sections.treatmentPlanForm": "Plan de tratamiento",
  "clinical.sections.validationHistory": "Historial de validaciones",
  "clinical.sections.scientificReferencesSuggested":
    "Referencias científicas sugeridas",
  "clinical.sections.scientificValidation": "Validación científica",
  "clinical.sections.targetedTherapeuticConduct": "Conducta terapéutica dirigida",
  "clinical.sections.clinicalPreview": "Vista previa clínica",
  "clinical.actions.newAnamnesis": "Nueva anamnesis",
  "clinical.actions.newEvolution": "Nueva evolución",
  "clinical.actions.recordEvolution": "Registrar evolución",
  "clinical.actions.saveDraft": "Guardar borrador",
  "clinical.actions.clearDraft": "Limpiar borrador",
  "clinical.actions.openSource": "Abrir fuente",
  "clinical.actions.markAsConsulted": "Marcar como consultada",
  "clinical.actions.markedAsConsulted": "Marcada como consultada",
  "clinical.actions.applyTemplate": "Aplicar plantilla",
  "clinical.actions.apply": "Aplicar",
  "clinical.actions.generateReportPdf": "Generar informe (PDF)",
  "clinical.actions.generatePlanPdf": "Generar PDF del plan",
  "clinical.actions.saveReport": "Guardar informe",
  "clinical.actions.validateAndApprove": "Validar y aprobar",
  "clinical.actions.reportValidated": "Informe validado",
  "clinical.actions.validateAnyway": "Validar de todos modos",
  "clinical.actions.fillWithAi": "Completar con IA",
  "clinical.actions.clearLocalDraft": "Limpiar borrador local",
  "clinical.actions.savePlan": "Guardar plan",
  "clinical.actions.regenerateFromAnamnesis": "Regenerar por anamnesis",
  "clinical.actions.recalculateReasoning": "Recalcular razonamiento",
  "clinical.actions.saveTriageAndRefer": "Guardar triaje y derivar",
  "clinical.actions.savePhysicalExam": "Guardar Examen Físico",
  "clinical.messages.clearDraftConfirm":
    "¿Seguro que deseas borrar el borrador?",
  "clinical.messages.newReportAndPlan": "Nuevo informe y plan",
  "clinical.messages.editReportAndPlan": "Editar informe y plan",
  "clinical.messages.saveBeforeGeneratePdf":
    "Guarde el informe antes de generar el PDF",
  "clinical.messages.applyTemplateConfirm":
    '¿Aplicar la plantilla "{template}"? Esto reemplazará los campos actuales.',
  "clinical.messages.saved": "Registro guardado con éxito",
  "clinical.messages.deleted": "Registro eliminado con éxito",
  "clinical.messages.aiSuggestionError":
    "No fue posible generar sugerencia por IA.",
  "clinical.messages.fillAnamnesisBeforeSavingPlan":
    "Complete la anamnesis antes de guardar el plan.",
  "clinical.messages.reviewHighlightedFields":
    "Revise los campos destacados para continuar.",
  "clinical.messages.planSavedSuccessfully": "Plan guardado con éxito.",
  "clinical.messages.fillAnamnesisBeforeSavingReport":
    "Complete la anamnesis antes de guardar el informe.",
  "clinical.messages.criticalChangesApplied":
    "Cambios críticos aplicados. Revalide el informe.",
  "clinical.messages.reportAndPlanSavedSuccessfully":
    "Informe y plan guardados con éxito",
  "clinical.messages.noPermissionSavePatientReport":
    "Sin permiso para guardar el informe de este paciente",
  "clinical.messages.patientNotFoundCurrentSession":
    "Paciente no encontrado para la sesión actual",
  "clinical.messages.saveReportBeforeValidation":
    "Guarde el informe antes de validar",
  "clinical.messages.saveChangesBeforeValidation":
    "Guarde los cambios antes de validar el informe",
  "clinical.messages.reportAlreadyValidated":
    "Este informe ya está validado",
  "clinical.messages.reportAndPlanValidatedSuccessfully":
    "Informe y plan validados con éxito",
  "clinical.messages.pdfGenerationError": "No fue posible generar el PDF",
  "clinical.messages.referenceOpenError":
    "No fue posible abrir la referencia",
  "clinical.messages.professionalNotesHint":
    "Notas del profesional para ajustes antes de la validación.",
  "clinical.messages.noValidationHistory":
    "Aún no hay validaciones registradas.",
  "clinical.messages.noPermissionAccessPatient":
    "Sin permiso para acceder a este paciente",
  "clinical.messages.noPermissionEditPlan":
    "Sin permiso para editar este plan.",
  "clinical.messages.planSaveError": "No fue posible guardar el plan.",
  "clinical.messages.treatmentPlanFormSubtitle":
    "Formulario independiente del informe con sugerencia inicial por IA.",
  "clinical.messages.lastEditedAt": "Última edición",
  "clinical.messages.applyInitialTemplateHint":
    "Aplique una plantilla inicial y ajústela según el caso.",
  "clinical.messages.aiUsedExamReadings":
    "La IA consideró lectura de {{total}} examen(es) de imagen adjunto(s).",
  "clinical.messages.aiUsedExamMetadata":
    "La IA consideró metadatos de {{total}} examen(es) adjunto(s).",
  "clinical.messages.scientificPdfTraceabilityHint":
    "En el PDF profesional, la validación científica y las referencias consultadas (cuando se marcan) pueden incluirse para trazabilidad.",
  "clinical.messages.scientificReferencesValidationRecommended":
    "Hay referencias sugeridas disponibles. Revise y marque al menos una antes de validar (recomendado).",
  "clinical.messages.validateWithoutConsultedReferencesConfirm":
    "Hay referencias científicas sugeridas sin marca de consulta. ¿Validar de todos modos?",
  "clinical.messages.suggestedProfile": "Perfil sugerido",
  "clinical.messages.forReport": "Para el informe",
  "clinical.messages.forTreatmentPlan": "Para el plan de tratamiento",
  "clinical.messages.consultedSourcesCount": "Fuentes consultadas",
  "clinical.messages.validatedByProfessional": "Validado por el profesional",
  "clinical.messages.pendingValidationDraft":
    "Borrador pendiente de validación",
  "clinical.messages.criticalChangesDetectedRevalidation":
    "Cambios críticos detectados. Revalidación necesaria.",
  "clinical.messages.unsavedChangesInReport":
    "Hay cambios no guardados en este informe",
  "clinical.messages.validatedAt": "Validado en",
  "clinical.messages.professionalValidationChecklistTitle":
    "Checklist de validación profesional",
  "clinical.messages.professionalValidationChecklistItem":
    "Revisé el informe/plan, verifiqué la coherencia clínica y asumo la validación profesional de este contenido.",
  "clinical.messages.validationChecklistRequired":
    "Confirme la validación profesional antes de aprobar el informe.",
  "clinical.messages.pdfWithoutConsultedReferencesWarning":
    "PDF profesional generado sin fuentes consultadas marcadas. Se recomienda revisar al menos una referencia para trazabilidad.",
  "clinical.labels.scientificTraceabilityPending":
    "Trazabilidad científica pendiente",
  "clinical.labels.pain": "Dolor",
  "clinical.labels.intensity": "Intensidad",
  "clinical.labels.shortTerm": "Corto plazo",
  "clinical.labels.mediumTerm": "Medio plazo",
  "clinical.labels.shortTermGoals": "Objetivos de corto plazo",
  "clinical.labels.mediumTermGoals": "Objetivos de medio plazo",
  "clinical.labels.weeklyFrequency": "Frecuencia semanal",
  "clinical.labels.durationWeeks": "Duración (semanas)",
  "clinical.labels.phasedPlan": "Plan por fases",
  "clinical.labels.therapeuticConducts": "Conductas terapeuticas",
  "clinical.labels.physicalExam": "Examen fisico",
  "clinical.labels.professionalDraft": "Borrador profesional",
  "clinical.labels.aiTreatmentPlan": "Plan de tratamiento generado por IA",
  "clinical.labels.dischargeCriteria": "Criterios de alta",
  "clinical.labels.observations": "Observaciones",
  "clinical.labels.guidelines": "Orientaciones",
  "clinical.labels.checkin": "Check-in",
  "clinical.labels.postSessionCheckin": "Check-in post-sesión",
  "clinical.labels.activePrescriptions": "Prescripciones activas",
  "clinical.labels.references": "Referencias",
  "clinical.templates.general": "General",
  "clinical.templates.lumbar": "Lumbar",
  "clinical.templates.cervical": "Cervical",
  "clinical.templates.knee": "Rodilla",
  "clinical.status.draft": "Borrador",
  "clinical.status.validated": "Validado",
  "clinical.status.noSuggestedSources": "Sin fuentes sugeridas",
  "clinical.status.pending": "Pendiente",
  "clinical.status.partial": "Parcial",
  "clinical.status.completed": "Completada",
  "clinical.status.revalidationPending": "Revalidación pendiente",
  "clinical.status.notTested": "No probado",
  "clinical.status.generating": "Generando...",
  "clinical.placeholders.functionalDiagnosis":
    "Describa el diagnóstico funcional",
  "clinical.placeholders.shortTermGoals":
    "Resultados esperados en las primeras semanas",
  "clinical.placeholders.mediumTermGoals":
    "Resultados esperados a medio plazo",
  "clinical.placeholders.therapeuticConducts":
    "Ejercicios, técnicas y conductas planificadas",
  "clinical.placeholders.phasedPlan": "Plan por fases/semanas",
  "clinical.placeholders.dischargeCriteria":
    "Defina los criterios de alta",
  "clinical.placeholders.dischargeCriteriaPatient":
    "Defina los criterios de alta del paciente",
  "clinical.placeholders.additionalObservations": "Observaciones adicionales",
  "clinical.placeholders.professionalDraftNotes":
    "Notas o borrador complementario del informe",
  "clinical.validation.functionalDiagnosisRequired":
    "El diagnóstico funcional es obligatorio",
  "clinical.validation.shortTermRequired":
    "Informe el objetivo de corto plazo.",
  "clinical.validation.therapeuticConductRequired":
    "Describa al menos una conducta terapéutica.",
  "clinical.validation.numberGreaterThanZero":
    "Use un número mayor que 0.",
  "clinical.validation.weeklyFrequencyRange":
    "La frecuencia semanal debe estar entre 1 y 7",
  "clinical.validation.durationWeeksRange":
    "La duración en semanas debe estar entre 1 y 52",
  "clinical.validation.movementPainReproductionRequired":
    "Informe qué movimiento reproduce el dolor.",
  "clinical.validation.primaryHypothesisRequired":
    "La hipótesis principal es obligatoria.",
  "clinical.validation.condutaDirectionRequired":
    "La dirección de conducta es obligatoria.",
  "clinical.validation.neuralDetailedRequired":
    "Para lesión neural, complete al menos un ítem del bloque neurológico detallado.",
  "clinical.validation.atLeastOneRegionalTestRequired":
    "Marque al menos una prueba regional como positiva o negativa.",
  "clinical.validation.referralDestinationRequired":
    "Informe el destino de derivación.",
  "clinical.validation.referralReasonRequired":
    "Describa el motivo clínico de la derivación.",
};
