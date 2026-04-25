import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum LaudoExameHistoricoAcao {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
}

export enum LaudoExameHistoricoOrigem {
  PROFISSIONAL = 'PROFISSIONAL',
  SISTEMA = 'SISTEMA',
}

@Entity('laudo_exame_historico')
export class LaudoExameHistorico extends BaseEntity {
  @Column({ name: 'laudo_id', type: 'uuid' })
  laudoId: string;

  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  @Column({ name: 'revisao', type: 'int' })
  revisao: number;

  @Column({
    name: 'acao',
    type: 'enum',
    enum: LaudoExameHistoricoAcao,
  })
  acao: LaudoExameHistoricoAcao;

  @Column({
    name: 'origem',
    type: 'enum',
    enum: LaudoExameHistoricoOrigem,
  })
  origem: LaudoExameHistoricoOrigem;

  @Column({ name: 'alterado_por_usuario_id', type: 'uuid', nullable: true })
  alteradoPorUsuarioId: string | null;

  @Column({ name: 'payload', type: 'jsonb' })
  payload: Record<string, unknown>;
}

