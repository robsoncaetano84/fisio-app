export declare class UpdateLaudoDto {
    diagnosticoFuncional?: string;
    objetivosCurtoPrazo?: string;
    objetivosMedioPrazo?: string;
    frequenciaSemanal?: number;
    duracaoSemanas?: number;
    condutas?: string;
    exameFisico?: string;
    planoTratamentoIA?: string;
    rascunhoProfissional?: string;
    observacoes?: string;
    criteriosAlta?: string;
    sugestaoSource?: 'ai' | 'rules';
    examesConsiderados?: number;
    examesComLeituraIa?: number;
}
