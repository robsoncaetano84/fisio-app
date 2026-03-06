import { BaseEntity } from '../../../common/entities/base.entity';
export declare enum CrmInteractionType {
    LIGACAO = "LIGACAO",
    WHATSAPP = "WHATSAPP",
    PROPOSTA = "PROPOSTA",
    DEMO = "DEMO",
    EMAIL = "EMAIL",
    REUNIAO = "REUNIAO",
    OUTRO = "OUTRO"
}
export declare class CrmInteraction extends BaseEntity {
    leadId: string;
    tipo: CrmInteractionType;
    resumo: string;
    detalhes: string | null;
    responsavelNome: string | null;
    responsavelUsuarioId: string | null;
    occurredAt: Date;
    ativo: boolean;
}
