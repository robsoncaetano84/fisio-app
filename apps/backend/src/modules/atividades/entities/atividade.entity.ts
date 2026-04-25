// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// ATIVIDADE.ENTITY
// ==========================================
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { AtividadeCheckin } from './atividade-checkin.entity';

@Entity('atividades')
@Index('IDX_ATIVIDADE_PACIENTE_STATUS', ['pacienteId', 'ativo'])
export class Atividade extends BaseEntity {
  @Column({ length: 140 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ name: 'data_limite', type: 'date', nullable: true })
  dataLimite: Date | null;

  @Column({ name: 'dia_prescricao', type: 'int', nullable: true })
  diaPrescricao: number | null;

  @Column({ name: 'ordem_no_dia', type: 'int', nullable: true })
  ordemNoDia: number | null;

  @Column({ name: 'repetir_semanal', type: 'boolean', default: true })
  repetirSemanal: boolean;

  @Column({ name: 'aceite_profissional', type: 'boolean', default: false })
  aceiteProfissional: boolean;

  @Column({
    name: 'aceite_profissional_por_usuario_id',
    type: 'uuid',
    nullable: true,
  })
  aceiteProfissionalPorUsuarioId: string | null;

  @Column({ name: 'aceite_profissional_em', type: 'timestamp', nullable: true })
  aceiteProfissionalEm: Date | null;

  @Column({ default: true })
  ativo: boolean;

  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @OneToMany(() => AtividadeCheckin, (checkin) => checkin.atividade)
  checkins: AtividadeCheckin[];
}
