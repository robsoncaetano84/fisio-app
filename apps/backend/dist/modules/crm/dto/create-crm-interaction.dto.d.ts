import { CrmInteractionType } from '../entities/crm-interaction.entity';
export declare class CreateCrmInteractionDto {
    leadId: string;
    tipo: CrmInteractionType;
    resumo: string;
    detalhes?: string;
    responsavelNome?: string;
    occurredAt?: string;
}
