import { UserRole, Usuario } from '../usuarios/entities/usuario.entity';
import { ActivateProtocolDto } from './dto/activate-protocol.dto';
import { LogAiSuggestionDto } from './dto/log-ai-suggestion.dto';
import { UpsertConsentDto } from './dto/upsert-consent.dto';
import { ClinicalGovernanceService } from './clinical-governance.service';
type ClinicalAuditActionTypeValue = 'READ' | 'EDIT' | 'APPROVAL';
export declare class ClinicalGovernanceController {
    private readonly governanceService;
    constructor(governanceService: ClinicalGovernanceService);
    getActiveProtocol(usuario: Usuario): Promise<import("./entities/clinical-protocol-version.entity").ClinicalProtocolVersion | null>;
    getProtocolHistory(usuario: Usuario, limit?: number): Promise<import("./entities/clinical-protocol-version.entity").ClinicalProtocolVersion[]>;
    activateProtocol(usuario: Usuario, dto: ActivateProtocolDto): Promise<import("./entities/clinical-protocol-version.entity").ClinicalProtocolVersion>;
    getMyConsents(usuario: Usuario): Promise<{
        userId: string;
        role: UserRole;
        snapshot: {
            consentTermsRequired: boolean;
            consentPrivacyRequired: boolean;
            consentResearchOptional: boolean;
            consentAiOptional: boolean;
            consentProfessionalLgpdRequired: boolean;
            consentAcceptedAt: Date | null;
        };
        history: import("./entities/consent-purpose-log.entity").ConsentPurposeLog[];
    }>;
    upsertMyConsent(usuario: Usuario, dto: UpsertConsentDto): Promise<{
        userId: string;
        role: UserRole;
        snapshot: {
            consentTermsRequired: boolean;
            consentPrivacyRequired: boolean;
            consentResearchOptional: boolean;
            consentAiOptional: boolean;
            consentProfessionalLgpdRequired: boolean;
            consentAcceptedAt: Date | null;
        };
        history: import("./entities/consent-purpose-log.entity").ConsentPurposeLog[];
    }>;
    logAiSuggestion(usuario: Usuario, dto: LogAiSuggestionDto): Promise<{
        ok: boolean;
        protocolVersion: string | null;
    }>;
    listAuditLogs(usuario: Usuario, actionType?: ClinicalAuditActionTypeValue, patientId?: string, limit?: number): Promise<{
        items: import("./entities/clinical-audit-log.entity").ClinicalAuditLog[];
        count: number;
    }>;
    getAiSuggestionSummary(usuario: Usuario, windowDays?: number, professionalId?: string, patientId?: string): Promise<{
        windowDays: number;
        since: Date;
        filters: {
            professionalId: string | null;
            patientId: string | null;
        };
        totals: {
            reads: number;
            applied: number;
            confirmed: number;
            adoptionRate: number;
            confirmationRate: number;
        };
        byStage: Record<"EXAME_FISICO" | "EVOLUCAO" | "LAUDO" | "PLANO" | "OUTROS", {
            reads: number;
            applied: number;
            confirmed: number;
        }>;
        timeline: {
            date: string;
            reads: number;
            applied: number;
            confirmed: number;
        }[];
    }>;
}
export {};
