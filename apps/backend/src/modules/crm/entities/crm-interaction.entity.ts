// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// C RM I NT ER AC TI ON.ENTITY
// ==========================================
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CrmInteractionType {
  LIGACAO = 'LIGACAO',
  WHATSAPP = 'WHATSAPP',
  PROPOSTA = 'PROPOSTA',
  DEMO = 'DEMO',
  EMAIL = 'EMAIL',
  REUNIAO = 'REUNIAO',
  OUTRO = 'OUTRO',
}

@Entity('crm_interactions')
@Index(['leadId'])
@Index(['occurredAt'])
export class CrmInteraction extends BaseEntity {
  @Column({ name: 'lead_id', type: 'uuid' })
  leadId: string;

  @Column({ type: 'enum', enum: CrmInteractionType })
  tipo: CrmInteractionType;

  @Column({ type: 'text' })
  resumo: string;

  @Column({ type: 'text', nullable: true })
  detalhes: string | null;

  @Column({
    type: 'varchar',
    name: 'responsavel_nome',
    length: 180,
    nullable: true,
  })
  responsavelNome: string | null;

  @Column({ name: 'responsavel_usuario_id', type: 'uuid', nullable: true })
  responsavelUsuarioId: string | null;

  @Column({ name: 'occurred_at', type: 'timestamp' })
  occurredAt: Date;

  @Column({ default: true })
  ativo: boolean;
}
