// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// L AU DO H IS TO RI CO.E NT IT Y
// ==========================================
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum LaudoHistoricoAcao {
  CRIADO = 'CRIADO',
  ATUALIZADO = 'ATUALIZADO',
  VALIDADO = 'VALIDADO',
}

// F6: trilha imutavel de versoes do laudo (documento clinico-legal). Cada
// escrita no laudo grava aqui um snapshot do conteudo com autor, acao e data.
@Entity('laudo_historico')
@Index('IDX_LAUDO_HISTORICO_LAUDO', ['laudoId'])
export class LaudoHistorico extends BaseEntity {
  @Column({ name: 'laudo_id', type: 'uuid' })
  laudoId: string;

  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  @Column({ name: 'acao', length: 20 })
  acao: LaudoHistoricoAcao;

  @Column({ name: 'status', length: 40 })
  status: string;

  @Column({ name: 'snapshot', type: 'jsonb' })
  snapshot: Record<string, unknown>;

  @Column({ name: 'alterado_por_usuario_id', type: 'uuid' })
  alteradoPorUsuarioId: string;
}
