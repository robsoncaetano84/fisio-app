// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// A TI VI DA DE C HE CK IN.E NT IT Y
// ==========================================
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Atividade } from './atividade.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum DificuldadeExecucao {
  FACIL = 'FACIL',
  MEDIO = 'MEDIO',
  DIFICIL = 'DIFICIL',
}

@Entity('atividade_checkins')
@Index('IDX_ATIVIDADE_CHECKIN_ATIVIDADE_DATA', ['atividadeId', 'createdAt'])
export class AtividadeCheckin extends BaseEntity {
  @Column({ name: 'concluiu', default: false })
  concluiu: boolean;

  @Column({ name: 'dor_antes', type: 'int', nullable: true })
  dorAntes: number | null;

  @Column({ name: 'dor_depois', type: 'int', nullable: true })
  dorDepois: number | null;

  @Column({
    name: 'dificuldade',
    type: 'enum',
    enum: DificuldadeExecucao,
    nullable: true,
  })
  dificuldade: DificuldadeExecucao | null;

  @Column({ name: 'tempo_minutos', type: 'int', nullable: true })
  tempoMinutos: number | null;

  @Column({ name: 'motivo_nao_execucao', type: 'text', nullable: true })
  motivoNaoExecucao: string | null;

  @Column({ name: 'feedback_livre', type: 'text', nullable: true })
  feedbackLivre: string | null;

  @ManyToOne(() => Atividade)
  @JoinColumn({ name: 'atividade_id' })
  atividade: Atividade;

  @Column({ name: 'atividade_id', type: 'uuid' })
  atividadeId: string;

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
}

