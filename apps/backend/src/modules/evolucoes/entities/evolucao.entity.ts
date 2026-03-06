// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// E VO LU CA O.E NT IT Y
// ==========================================
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';

export enum CheckinDificuldade {
  FACIL = 'FACIL',
  MEDIO = 'MEDIO',
  DIFICIL = 'DIFICIL',
}

@Entity('evolucoes')
@Index('IDX_EVOLUCAO_PACIENTE_DATA', ['pacienteId', 'data'])
export class Evolucao extends BaseEntity {
  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @Column({ name: 'paciente_id' })
  pacienteId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data: Date;

  @Column({ type: 'text', nullable: true })
  listagens: string;

  @Column({ name: 'leg_check', type: 'text', nullable: true })
  legCheck: string;

  @Column({ type: 'text', nullable: true })
  ajustes: string;

  @Column({ type: 'text', nullable: true })
  orientacoes: string;

  @Column({ name: 'checkin_dor', type: 'int', nullable: true })
  checkinDor: number | null;

  @Column({
    name: 'checkin_dificuldade',
    type: 'enum',
    enum: CheckinDificuldade,
    nullable: true,
  })
  checkinDificuldade: CheckinDificuldade | null;

  @Column({ name: 'checkin_observacao', type: 'text', nullable: true })
  checkinObservacao: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string;
}
