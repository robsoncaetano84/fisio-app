import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Paciente } from './paciente.entity';

export enum ProfissionalPacienteVinculoStatus {
  ATIVO = 'ATIVO',
  ENCERRADO = 'ENCERRADO',
}

export enum ProfissionalPacienteVinculoOrigem {
  CADASTRO_ASSISTIDO = 'CADASTRO_ASSISTIDO',
  CONVITE_RAPIDO = 'CONVITE_RAPIDO',
  MANUAL = 'MANUAL',
}

@Entity('profissional_paciente_vinculos')
@Index('IDX_VINCULO_PROFISSIONAL_STATUS', ['profissionalId', 'status'])
@Index('IDX_VINCULO_PACIENTE_USUARIO_STATUS', ['pacienteUsuarioId', 'status'])
@Index('IDX_VINCULO_PACIENTE_STATUS', ['pacienteId', 'status'])
export class ProfissionalPacienteVinculo extends BaseEntity {
  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'profissional_id' })
  profissional: Usuario;

  @Column({ name: 'profissional_id', type: 'uuid' })
  profissionalId: string;

  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'paciente_usuario_id' })
  pacienteUsuario: Usuario;

  @Column({ name: 'paciente_usuario_id', type: 'uuid' })
  pacienteUsuarioId: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ProfissionalPacienteVinculoStatus,
    default: ProfissionalPacienteVinculoStatus.ATIVO,
  })
  status: ProfissionalPacienteVinculoStatus;

  @Column({
    name: 'origem',
    type: 'enum',
    enum: ProfissionalPacienteVinculoOrigem,
    default: ProfissionalPacienteVinculoOrigem.CADASTRO_ASSISTIDO,
  })
  origem: ProfissionalPacienteVinculoOrigem;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt: Date | null;
}
