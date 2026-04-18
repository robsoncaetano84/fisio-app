import { BaseEntity } from '../../../common/entities/base.entity';
export declare enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER",
    PACIENTE = "PACIENTE"
}
export declare class Usuario extends BaseEntity {
    nome: string;
    email: string;
    senha: string;
    conselhoSigla: string;
    conselhoUf: string;
    conselhoProf: string;
    registroProf: string;
    especialidade: string;
    ativo: boolean;
    role: UserRole;
    consentTermsRequired: boolean;
    consentPrivacyRequired: boolean;
    consentResearchOptional: boolean;
    consentAiOptional: boolean;
    consentAcceptedAt: Date | null;
    consentProfessionalLgpdRequired: boolean;
}
