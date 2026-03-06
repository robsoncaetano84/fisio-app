import { MotivoBusca, InicioProblema, AreaAfetada } from '../entities/anamnese.entity';
export declare class UpdateAnamneseDto {
    motivoBusca?: MotivoBusca;
    areasAfetadas?: AreaAfetada[];
    intensidadeDor?: number;
    descricaoSintomas?: string;
    tempoProblema?: string;
    horaIntensifica?: string;
    inicioProblema?: InicioProblema;
    eventoEspecifico?: string;
    fatorAlivio?: string;
    problemaAnterior?: boolean;
    quandoProblemaAnterior?: string;
    tratamentosAnteriores?: string[];
    historicoFamiliar?: string;
    horasSonoMedia?: string;
    qualidadeSono?: number;
    nivelEstresse?: number;
    humorPredominante?: string;
    energiaDiaria?: number;
    atividadeFisicaRegular?: boolean;
    frequenciaAtividadeFisica?: string;
    apoioEmocional?: number;
    observacoesEstiloVida?: string;
}
