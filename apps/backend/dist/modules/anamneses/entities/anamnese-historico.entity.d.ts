import { BaseEntity } from '../../../common/entities/base.entity';
export declare enum AnamneseHistoricoAcao {
    CREATE = "CREATE",
    UPDATE = "UPDATE"
}
export declare enum AnamneseHistoricoOrigem {
    PROFISSIONAL = "PROFISSIONAL",
    PACIENTE = "PACIENTE"
}
export declare class AnamneseHistorico extends BaseEntity {
    anamneseId: string;
    pacienteId: string;
    revisao: number;
    acao: AnamneseHistoricoAcao;
    origem: AnamneseHistoricoOrigem;
    alteradoPorUsuarioId: string | null;
    payload: Record<string, unknown>;
}
