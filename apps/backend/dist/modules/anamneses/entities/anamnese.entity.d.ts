import { BaseEntity } from '../../../common/entities/base.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';
export declare enum MotivoBusca {
    SINTOMA_EXISTENTE = "SINTOMA_EXISTENTE",
    PREVENTIVO = "PREVENTIVO"
}
export declare enum InicioProblema {
    GRADUAL = "GRADUAL",
    REPENTINO = "REPENTINO",
    APOS_EVENTO = "APOS_EVENTO",
    NAO_SABE = "NAO_SABE"
}
export declare enum TipoDor {
    MECANICA = "MECANICA",
    INFLAMATORIA = "INFLAMATORIA",
    NEUROPATICA = "NEUROPATICA",
    MISTA = "MISTA"
}
export declare enum MecanismoLesao {
    TRAUMA = "TRAUMA",
    SOBRECARGA = "SOBRECARGA",
    MISTO = "MISTO",
    NAO_DEFINIDO = "NAO_DEFINIDO"
}
export interface AreaAfetada {
    regiao: string;
    lado?: 'esquerdo' | 'direito' | 'ambos';
    vista?: 'anterior' | 'posterior';
    intensidade?: number;
    observacao?: string;
}
export type FenotipoDorEvidencias = Record<string, boolean>;
export declare class Anamnese extends BaseEntity {
    paciente: Paciente;
    pacienteId: string;
    motivoBusca: MotivoBusca;
    areasAfetadas: AreaAfetada[];
    intensidadeDor: number;
    descricaoSintomas: string;
    tempoProblema: string;
    horaIntensifica: string;
    inicioProblema: InicioProblema;
    eventoEspecifico: string;
    fatorAlivio: string;
    mecanismoLesao: MecanismoLesao;
    fatoresPiora: string;
    dorRepouso: boolean;
    dorNoturna: boolean;
    irradiacao: boolean;
    localIrradiacao: string;
    tipoDor: TipoDor;
    fenotipoDorEvidencias: FenotipoDorEvidencias;
    sinaisSensibilizacaoCentral: string;
    redFlags: string[];
    yellowFlags: string[];
    problemaAnterior: boolean;
    quandoProblemaAnterior: string;
    tratamentosAnteriores: string[];
    lesoesPrevias: string;
    usoMedicamentos: string;
    limitacoesFuncionais: string;
    atividadesQuePioram: string;
    metaPrincipalPaciente: string;
    horasSonoMedia: string;
    qualidadeSono: number;
    nivelEstresse: number;
    humorPredominante: string;
    energiaDiaria: number;
    atividadeFisicaRegular: boolean;
    frequenciaAtividadeFisica: string;
    apoioEmocional: number;
    observacoesEstiloVida: string;
}
