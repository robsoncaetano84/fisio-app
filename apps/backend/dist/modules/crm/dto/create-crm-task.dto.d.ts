import { CrmTaskStatus } from '../entities/crm-task.entity';
export declare class CreateCrmTaskDto {
    titulo: string;
    descricao?: string;
    leadId?: string;
    responsavelNome?: string;
    dueAt?: string;
    status?: CrmTaskStatus;
}
