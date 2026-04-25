// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// L AU DO.ENTITY
// ==========================================
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';

export enum LaudoStatus {
  RASCUNHO_IA = 'RASCUNHO_IA',
  VALIDADO_PROFISSIONAL = 'VALIDADO_PROFISSIONAL',
}

@Entity('laudos')
export class Laudo extends BaseEntity {
  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @Column({ name: 'paciente_id' })
  pacienteId: string;

  @Column({ name: 'diagnostico_funcional', type: 'text' })
  diagnosticoFuncional: string;

  @Column({ name: 'objetivos_curto_prazo', type: 'text', nullable: true })
  objetivosCurtoPrazo: string | null;

  @Column({ name: 'objetivos_medio_prazo', type: 'text', nullable: true })
  objetivosMedioPrazo: string | null;

  @Column({ name: 'frequencia_semanal', type: 'int', nullable: true })
  frequenciaSemanal: number | null;

  @Column({ name: 'duracao_semanas', type: 'int', nullable: true })
  duracaoSemanas: number | null;

  @Column({ type: 'text' })
  condutas: string;

  @Column({ name: 'exame_fisico', type: 'text', nullable: true })
  exameFisico: string | null;

  @Column({ name: 'plano_tratamento_ia', type: 'text', nullable: true })
  planoTratamentoIA: string | null;

  @Column({ name: 'rascunho_profissional', type: 'text', nullable: true })
  rascunhoProfissional: string | null;

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string | null;

  @Column({
    type: 'enum',
    enum: LaudoStatus,
    default: LaudoStatus.RASCUNHO_IA,
  })
  status: LaudoStatus;

  @Column({ name: 'validado_por_usuario_id', type: 'uuid', nullable: true })
  validadoPorUsuarioId: string | null;

  @Column({ name: 'validado_em', type: 'timestamp', nullable: true })
  validadoEm: Date | null;

  @Column({ name: 'criterios_alta', type: 'text', nullable: true })
  criteriosAlta: string | null;

  @Column({
    name: 'sugestao_source',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  sugestaoSource: 'ai' | 'rules' | null;

  @Column({ name: 'exames_considerados', type: 'int', nullable: true })
  examesConsiderados: number | null;

  @Column({ name: 'exames_com_leitura_ia', type: 'int', nullable: true })
  examesComLeituraIa: number | null;

  @Column({ name: 'sugestao_gerada_em', type: 'timestamp', nullable: true })
  sugestaoGeradaEm: Date | null;
}
