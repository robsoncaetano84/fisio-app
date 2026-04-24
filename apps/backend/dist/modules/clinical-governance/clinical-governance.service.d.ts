import { Repository } from 'typeorm';
import { UserRole, Usuario } from '../usuarios/entities/usuario.entity';
import { ActivateProtocolDto } from './dto/activate-protocol.dto';
import { LogAiSuggestionDto } from './dto/log-ai-suggestion.dto';
import { UpsertConsentDto } from './dto/upsert-consent.dto';
import { ClinicalAuditActionType, ClinicalAuditLog } from './entities/clinical-audit-log.entity';
import { ConsentPurposeLog } from './entities/consent-purpose-log.entity';
import { ClinicalProtocolVersion } from './entities/clinical-protocol-version.entity';
export declare class ClinicalGovernanceService {
    private readonly protocolRepository;
    private readonly consentRepository;
    private readonly auditRepository;
    private readonly usuarioRepository;
    constructor(protocolRepository: Repository<ClinicalProtocolVersion>, consentRepository: Repository<ConsentPurposeLog>, auditRepository: Repository<ClinicalAuditLog>, usuarioRepository: Repository<Usuario>);
    getActiveProtocol(usuario: Usuario): Promise<ClinicalProtocolVersion | null>;
    getProtocolHistory(usuario: Usuario, limit?: number): Promise<ClinicalProtocolVersion[]>;
    activateProtocol(dto: ActivateProtocolDto, usuario: Usuario): Promise<ClinicalProtocolVersion>;
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
        history: ConsentPurposeLog[];
    }>;
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
        history: ConsentPurposeLog[];
    }>;
    listAuditLogs(usuario: Usuario, params: {
        actionType?: ClinicalAuditActionType;
        patientId?: string;
        limit?: number;
    }): Promise<{
        items: ClinicalAuditLog[];
        count: number;
    }>;
    getAiSuggestionSummary(usuario: Usuario, params?: {
        windowDays?: number;
        professionalId?: string;
        patientId?: string;
    }): Promise<{
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
    writeAudit(input: {
        actor: Usuario | null;
        actionType: ClinicalAuditActionType;
        action: string;
        resourceType?: string | null;
        resourceId?: string | null;
        patientId?: string | null;
        metadata?: Record<string, any>;
    }): Promise<void>;
    logAiSuggestion(usuario: Usuario, dto: LogAiSuggestionDto): Promise<{
        ok: boolean;
        protocolVersion: string | null;
    }>;
    private applyConsentToUser;
    private assertAdmin;
}
