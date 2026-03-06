import { BaseEntity } from '../../../common/entities/base.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';
export declare enum CheckinDificuldade {
    FACIL = "FACIL",
    MEDIO = "MEDIO",
    DIFICIL = "DIFICIL"
}
export declare class Evolucao extends BaseEntity {
    paciente: Paciente;
    pacienteId: string;
    data: Date;
    listagens: string;
    legCheck: string;
    ajustes: string;
    orientacoes: string;
    checkinDor: number | null;
    checkinDificuldade: CheckinDificuldade | null;
    checkinObservacao: string | null;
    observacoes: string;
}
