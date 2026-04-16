import { DificuldadeExecucao, MelhoriaSessao } from '../entities/atividade-checkin.entity';
export declare class CreateAtividadeCheckinDto {
    concluiu: boolean;
    dorAntes?: number;
    dorDepois?: number;
    dificuldade?: DificuldadeExecucao;
    tempoMinutos?: number;
    melhoriaSessao?: MelhoriaSessao;
    melhoriaDescricao?: string;
    motivoNaoExecucao?: string;
    feedbackLivre?: string;
}
