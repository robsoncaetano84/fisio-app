import { CheckinDificuldade } from '../entities/evolucao.entity';
export declare class UpdateEvolucaoDto {
    data?: string;
    listagens?: string;
    legCheck?: string;
    ajustes?: string;
    orientacoes?: string;
    checkinDor?: number;
    checkinDificuldade?: CheckinDificuldade;
    checkinObservacao?: string;
    observacoes?: string;
}
