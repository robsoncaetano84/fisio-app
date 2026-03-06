import { BaseEntity } from '../../../common/entities/base.entity';
export declare enum CrmTaskStatus {
    PENDENTE = "PENDENTE",
    CONCLUIDA = "CONCLUIDA"
}
export declare class CrmTask extends BaseEntity {
    titulo: string;
    descricao: string | null;
    leadId: string | null;
    responsavelNome: string | null;
    responsavelUsuarioId: string | null;
    dueAt: Date | null;
    status: CrmTaskStatus;
    ativo: boolean;
}
