// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// C RM T AS K.ENTITY
// ==========================================
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CrmTaskStatus {
  PENDENTE = 'PENDENTE',
  CONCLUIDA = 'CONCLUIDA',
}

@Entity('crm_tasks')
@Index(['status'])
@Index(['dueAt'])
export class CrmTask extends BaseEntity {
  @Column({ length: 220 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ name: 'lead_id', type: 'uuid', nullable: true })
  leadId: string | null;

  @Column({
    type: 'varchar',
    name: 'responsavel_nome',
    length: 180,
    nullable: true,
  })
  responsavelNome: string | null;

  @Column({ name: 'responsavel_usuario_id', type: 'uuid', nullable: true })
  responsavelUsuarioId: string | null;

  @Column({ name: 'due_at', type: 'timestamp', nullable: true })
  dueAt: Date | null;

  @Column({
    type: 'enum',
    enum: CrmTaskStatus,
    default: CrmTaskStatus.PENDENTE,
  })
  status: CrmTaskStatus;

  @Column({ default: true })
  ativo: boolean;
}
