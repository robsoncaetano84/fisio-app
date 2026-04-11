import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Paciente } from './paciente.entity';
export declare enum ProfissionalPacienteVinculoStatus {
    ATIVO = "ATIVO",
    ENCERRADO = "ENCERRADO"
}
export declare enum ProfissionalPacienteVinculoOrigem {
    CADASTRO_ASSISTIDO = "CADASTRO_ASSISTIDO",
    CONVITE_RAPIDO = "CONVITE_RAPIDO",
    MANUAL = "MANUAL"
}
export declare class ProfissionalPacienteVinculo extends BaseEntity {
    profissional: Usuario;
    profissionalId: string;
    paciente: Paciente;
    pacienteId: string;
    pacienteUsuario: Usuario;
    pacienteUsuarioId: string;
    status: ProfissionalPacienteVinculoStatus;
    origem: ProfissionalPacienteVinculoOrigem;
    endedAt: Date | null;
}
