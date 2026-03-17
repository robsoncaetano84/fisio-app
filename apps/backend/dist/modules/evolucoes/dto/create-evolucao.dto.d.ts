import { CheckinDificuldade, VariacaoStatus, AdesaoStatus, EvolucaoStatus, CondutaStatus } from '../entities/evolucao.entity';
export declare class CreateEvolucaoDto {
    pacienteId: string;
    data?: string;
    listagens?: string;
    legCheck?: string;
    ajustes: string;
    orientacoes?: string;
    checkinDor?: number;
    checkinDificuldade?: CheckinDificuldade;
    checkinObservacao?: string;
    dorStatus?: VariacaoStatus;
    funcaoStatus?: VariacaoStatus;
    adesaoStatus?: AdesaoStatus;
    statusEvolucao?: EvolucaoStatus;
    condutaStatus?: CondutaStatus;
    observacoes?: string;
}
