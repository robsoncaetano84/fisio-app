export type ClinicalAuditActionType = 'READ' | 'EDIT' | 'APPROVAL';
export declare class ClinicalAuditLog {
    id: string;
    actorId: string | null;
    actorRole: string | null;
    patientId: string | null;
    actionType: ClinicalAuditActionType;
    action: string;
    resourceType: string | null;
    resourceId: string | null;
    metadata: Record<string, any>;
    createdAt: Date;
}
