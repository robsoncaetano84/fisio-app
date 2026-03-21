// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
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

export enum VariacaoStatus {
  MELHOROU = 'MELHOROU',
  MANTEVE = 'MANTEVE',
  PIOROU = 'PIOROU',
}

export enum AdesaoStatus {
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  BAIXA = 'BAIXA',
}

export enum EvolucaoStatus {
  EVOLUINDO_BEM = 'EVOLUINDO_BEM',
  ESTAGNADO = 'ESTAGNADO',
  PIORA = 'PIORA',
}

export enum CondutaStatus {
  MANTER = 'MANTER',
  PROGREDIR = 'PROGREDIR',
  REGREDIR = 'REGREDIR',
  REAVALIAR = 'REAVALIAR',
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

  @Column({ name: 'listagens', type: 'text', nullable: true })
  subjetivo: string;

  @Column({ name: 'leg_check', type: 'text', nullable: true })
  objetivo: string;

  @Column({ name: 'ajustes', type: 'text', nullable: true })
  avaliacao: string;

  @Column({ name: 'orientacoes', type: 'text', nullable: true })
  plano: string;

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

  @Column({
    name: 'dor_status',
    type: 'enum',
    enum: VariacaoStatus,
    nullable: true,
  })
  dorStatus: VariacaoStatus | null;

  @Column({
    name: 'funcao_status',
    type: 'enum',
    enum: VariacaoStatus,
    nullable: true,
  })
  funcaoStatus: VariacaoStatus | null;

  @Column({
    name: 'adesao_status',
    type: 'enum',
    enum: AdesaoStatus,
    nullable: true,
  })
  adesaoStatus: AdesaoStatus | null;

  @Column({
    name: 'status_evolucao',
    type: 'enum',
    enum: EvolucaoStatus,
    nullable: true,
  })
  statusEvolucao: EvolucaoStatus | null;

  @Column({
    name: 'conduta_status',
    type: 'enum',
    enum: CondutaStatus,
    nullable: true,
  })
  condutaStatus: CondutaStatus | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string;
}

