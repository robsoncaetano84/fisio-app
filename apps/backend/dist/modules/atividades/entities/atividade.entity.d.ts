import { BaseEntity } from '../../../common/entities/base.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { AtividadeCheckin } from './atividade-checkin.entity';
export declare class Atividade extends BaseEntity {
    titulo: string;
    descricao: string | null;
    dataLimite: Date | null;
    diaPrescricao: number | null;
    ordemNoDia: number | null;
    repetirSemanal: boolean;
    aceiteProfissional: boolean;
    aceiteProfissionalPorUsuarioId: string | null;
    aceiteProfissionalEm: Date | null;
    ativo: boolean;
    paciente: Paciente;
    pacienteId: string;
    usuario: Usuario;
    usuarioId: string;
    checkins: AtividadeCheckin[];
}
