import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';

@Entity('laudo_exames_fisicos')
@Index('idx_laudo_exames_fisicos_paciente_created', ['pacienteId', 'createdAt'])
@Index('uq_laudo_exames_fisicos_paciente', ['pacienteId'], { unique: true })
export class LaudoExameFisico extends BaseEntity {
  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  @Column({ name: 'laudo_id', type: 'uuid', nullable: true })
  laudoId: string | null;

  @Column({ name: 'exame_fisico', type: 'text' })
  exameFisico: string;

  @Column({ name: 'diagnostico_funcional', type: 'text', nullable: true })
  diagnosticoFuncional: string | null;

  @Column({ name: 'condutas', type: 'text', nullable: true })
  condutas: string | null;

  @Column({ name: 'registrado_por_usuario_id', type: 'uuid', nullable: true })
  registradoPorUsuarioId: string | null;
}
