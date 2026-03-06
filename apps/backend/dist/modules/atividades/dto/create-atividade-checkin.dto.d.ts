import { DificuldadeExecucao } from '../entities/atividade-checkin.entity';
export declare class CreateAtividadeCheckinDto {
    concluiu: boolean;
    dorAntes?: number;
    dorDepois?: number;
    dificuldade?: DificuldadeExecucao;
    tempoMinutos?: number;
    motivoNaoExecucao?: string;
    feedbackLivre?: string;
}
