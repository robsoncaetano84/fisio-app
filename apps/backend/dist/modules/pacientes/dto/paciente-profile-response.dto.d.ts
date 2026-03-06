import { LaudoStatus } from '../../laudos/entities/laudo.entity';
import { Paciente } from '../entities/paciente.entity';
export declare class PacienteProfileResumoDto {
    ultimaEvolucaoEm: Date | null;
    ultimoLaudoAtualizadoEm: Date | null;
    statusLaudo: LaudoStatus | null;
}
export declare class PacienteProfileResponseDto {
    paciente: Paciente;
    resumo: PacienteProfileResumoDto;
}
