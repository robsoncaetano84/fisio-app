export type ConsentPurpose = 'TERMS_REQUIRED' | 'PRIVACY_REQUIRED' | 'RESEARCH_OPTIONAL' | 'AI_OPTIONAL' | 'PROFESSIONAL_LGPD_REQUIRED';
export declare class ConsentPurposeLog {
    id: string;
    userId: string;
    purpose: ConsentPurpose;
    accepted: boolean;
    acceptedAt: Date | null;
    protocolVersion: string | null;
    source: string;
    changedBy: string | null;
    createdAt: Date;
}
