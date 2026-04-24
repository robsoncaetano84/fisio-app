export declare class LogAiSuggestionDto {
    stage: string;
    suggestionType: string;
    confidence: 'BAIXA' | 'MODERADA' | 'ALTA';
    reason: string;
    evidenceFields?: string[];
    patientId?: string;
}
