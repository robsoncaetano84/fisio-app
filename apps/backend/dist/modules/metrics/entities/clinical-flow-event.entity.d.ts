export type ClinicalFlowStage = 'ANAMNESE' | 'EXAME_FISICO' | 'EVOLUCAO';
export type ClinicalFlowEventType = 'STAGE_OPENED' | 'STAGE_COMPLETED' | 'STAGE_ABANDONED' | 'STAGE_BLOCKED';
export declare class ClinicalFlowEvent {
    id: string;
    professionalId: string;
    patientId: string | null;
    stage: ClinicalFlowStage;
    eventType: ClinicalFlowEventType;
    durationMs: number | null;
    blockedReason: string | null;
    occurredAt: Date;
    createdAt: Date;
}
