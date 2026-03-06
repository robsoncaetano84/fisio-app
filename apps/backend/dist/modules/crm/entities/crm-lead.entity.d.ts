import { BaseEntity } from '../../../common/entities/base.entity';
export declare enum CrmLeadStage {
    NOVO = "NOVO",
    CONTATO = "CONTATO",
    PROPOSTA = "PROPOSTA",
    FECHADO = "FECHADO"
}
export declare enum CrmLeadChannel {
    SITE = "SITE",
    WHATSAPP = "WHATSAPP",
    INDICACAO = "INDICACAO",
    INSTAGRAM = "INSTAGRAM",
    OUTRO = "OUTRO"
}
export declare class CrmLead extends BaseEntity {
    nome: string;
    empresa: string | null;
    canal: CrmLeadChannel;
    stage: CrmLeadStage;
    responsavelNome: string | null;
    responsavelUsuarioId: string | null;
    valorPotencial: string;
    observacoes: string | null;
    ativo: boolean;
}
