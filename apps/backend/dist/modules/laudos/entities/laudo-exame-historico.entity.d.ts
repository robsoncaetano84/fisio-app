import { BaseEntity } from '../../../common/entities/base.entity';
export declare enum LaudoExameHistoricoAcao {
    CREATE = "CREATE",
    UPDATE = "UPDATE"
}
export declare enum LaudoExameHistoricoOrigem {
    PROFISSIONAL = "PROFISSIONAL",
    SISTEMA = "SISTEMA"
}
export declare class LaudoExameHistorico extends BaseEntity {
    laudoId: string;
    pacienteId: string;
    revisao: number;
    acao: LaudoExameHistoricoAcao;
    origem: LaudoExameHistoricoOrigem;
    alteradoPorUsuarioId: string | null;
    payload: Record<string, unknown>;
}
