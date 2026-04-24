export declare class ClinicalProtocolVersion {
    id: string;
    name: string;
    version: string;
    isActive: boolean;
    definition: Record<string, any>;
    activatedAt: Date | null;
    deactivatedAt: Date | null;
    activatedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}
