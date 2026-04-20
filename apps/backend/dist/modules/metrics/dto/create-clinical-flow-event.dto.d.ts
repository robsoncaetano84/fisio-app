type ClinicalFlowStage = 'ANAMNESE' | 'EXAME_FISICO' | 'EVOLUCAO';
type ClinicalFlowEventType = 'STAGE_OPENED' | 'STAGE_COMPLETED' | 'STAGE_ABANDONED' | 'STAGE_BLOCKED';
export declare class CreateClinicalFlowEventDto {
    stage: ClinicalFlowStage;
    eventType: ClinicalFlowEventType;
    patientId?: string;
    durationMs?: number;
    blockedReason?: string;
}
export {};
