import { BaseEntity } from '../../../common/entities/base.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';
export declare enum LaudoStatus {
    RASCUNHO_IA = "RASCUNHO_IA",
    VALIDADO_PROFISSIONAL = "VALIDADO_PROFISSIONAL"
}
export declare class Laudo extends BaseEntity {
    paciente: Paciente;
    pacienteId: string;
    diagnosticoFuncional: string;
    objetivosCurtoPrazo: string | null;
    objetivosMedioPrazo: string | null;
    frequenciaSemanal: number | null;
    duracaoSemanas: number | null;
    condutas: string;
    exameFisico: string | null;
    planoTratamentoIA: string | null;
    rascunhoProfissional: string | null;
    observacoes: string | null;
    status: LaudoStatus;
    validadoPorUsuarioId: string | null;
    validadoEm: Date | null;
    criteriosAlta: string | null;
    sugestaoSource: 'ai' | 'rules' | null;
    examesConsiderados: number | null;
    examesComLeituraIa: number | null;
    sugestaoGeradaEm: Date | null;
}
