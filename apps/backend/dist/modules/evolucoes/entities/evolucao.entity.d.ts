import { BaseEntity } from '../../../common/entities/base.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';
export declare enum CheckinDificuldade {
    FACIL = "FACIL",
    MEDIO = "MEDIO",
    DIFICIL = "DIFICIL"
}
export declare enum VariacaoStatus {
    MELHOROU = "MELHOROU",
    MANTEVE = "MANTEVE",
    PIOROU = "PIOROU"
}
export declare enum AdesaoStatus {
    ALTA = "ALTA",
    MEDIA = "MEDIA",
    BAIXA = "BAIXA"
}
export declare enum EvolucaoStatus {
    EVOLUINDO_BEM = "EVOLUINDO_BEM",
    ESTAGNADO = "ESTAGNADO",
    PIORA = "PIORA"
}
export declare enum CondutaStatus {
    MANTER = "MANTER",
    PROGREDIR = "PROGREDIR",
    REGREDIR = "REGREDIR",
    REAVALIAR = "REAVALIAR"
}
export declare class Evolucao extends BaseEntity {
    paciente: Paciente;
    pacienteId: string;
    data: Date;
    subjetivo: string;
    objetivo: string;
    avaliacao: string;
    plano: string;
    checkinDor: number | null;
    checkinDificuldade: CheckinDificuldade | null;
    checkinObservacao: string | null;
    dorStatus: VariacaoStatus | null;
    funcaoStatus: VariacaoStatus | null;
    adesaoStatus: AdesaoStatus | null;
    statusEvolucao: EvolucaoStatus | null;
    condutaStatus: CondutaStatus | null;
    observacoes: string;
}
