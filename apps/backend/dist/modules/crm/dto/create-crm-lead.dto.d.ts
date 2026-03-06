import { CrmLeadChannel, CrmLeadStage } from '../entities/crm-lead.entity';
export declare class CreateCrmLeadDto {
    nome: string;
    empresa?: string;
    canal?: CrmLeadChannel;
    stage?: CrmLeadStage;
    responsavelNome?: string;
    valorPotencial?: number;
    observacoes?: string;
}
