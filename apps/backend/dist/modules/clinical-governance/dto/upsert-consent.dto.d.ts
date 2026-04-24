type ConsentPurposeValue = 'TERMS_REQUIRED' | 'PRIVACY_REQUIRED' | 'RESEARCH_OPTIONAL' | 'AI_OPTIONAL' | 'PROFESSIONAL_LGPD_REQUIRED';
export declare class UpsertConsentDto {
    purpose: ConsentPurposeValue;
    accepted: boolean;
    source?: string;
}
export {};
