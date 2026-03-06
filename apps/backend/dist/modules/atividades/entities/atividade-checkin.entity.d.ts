import { BaseEntity } from '../../../common/entities/base.entity';
import { Atividade } from './atividade.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
export declare enum DificuldadeExecucao {
    FACIL = "FACIL",
    MEDIO = "MEDIO",
    DIFICIL = "DIFICIL"
}
export declare class AtividadeCheckin extends BaseEntity {
    concluiu: boolean;
    dorAntes: number | null;
    dorDepois: number | null;
    dificuldade: DificuldadeExecucao | null;
    tempoMinutos: number | null;
    motivoNaoExecucao: string | null;
    feedbackLivre: string | null;
    atividade: Atividade;
    atividadeId: string;
    paciente: Paciente;
    pacienteId: string;
    usuario: Usuario;
    usuarioId: string;
}
