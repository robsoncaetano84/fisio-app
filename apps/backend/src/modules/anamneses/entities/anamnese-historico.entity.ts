import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum AnamneseHistoricoAcao {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
}

export enum AnamneseHistoricoOrigem {
  PROFISSIONAL = 'PROFISSIONAL',
  PACIENTE = 'PACIENTE',
}

@Entity('anamneses_historico')
@Index('idx_anamneses_historico_anamnese_created', ['anamneseId', 'createdAt'])
@Index('idx_anamneses_historico_paciente_created', ['pacienteId', 'createdAt'])
export class AnamneseHistorico extends BaseEntity {
  @Column({ name: 'anamnese_id', type: 'uuid' })
  anamneseId: string;

  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  @Column({ name: 'revisao', type: 'int' })
  revisao: number;

  @Column({ name: 'acao', type: 'enum', enum: AnamneseHistoricoAcao })
  acao: AnamneseHistoricoAcao;

  @Column({ name: 'origem', type: 'enum', enum: AnamneseHistoricoOrigem })
  origem: AnamneseHistoricoOrigem;

  @Column({ name: 'alterado_por_usuario_id', type: 'uuid', nullable: true })
  alteradoPorUsuarioId: string | null;

  @Column({ name: 'payload', type: 'jsonb' })
  payload: Record<string, unknown>;
}

