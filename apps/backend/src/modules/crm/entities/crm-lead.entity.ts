// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// C RM L EA D.E NT IT Y
// ==========================================
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CrmLeadStage {
  NOVO = 'NOVO',
  CONTATO = 'CONTATO',
  PROPOSTA = 'PROPOSTA',
  FECHADO = 'FECHADO',
}

export enum CrmLeadChannel {
  SITE = 'SITE',
  WHATSAPP = 'WHATSAPP',
  INDICACAO = 'INDICACAO',
  INSTAGRAM = 'INSTAGRAM',
  OUTRO = 'OUTRO',
}

@Entity('crm_leads')
@Index(['stage'])
@Index(['updatedAt'])
export class CrmLead extends BaseEntity {
  @Column({ length: 180 })
  nome: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  empresa: string | null;

  @Column({ type: 'enum', enum: CrmLeadChannel, default: CrmLeadChannel.OUTRO })
  canal: CrmLeadChannel;

  @Column({ type: 'enum', enum: CrmLeadStage, default: CrmLeadStage.NOVO })
  stage: CrmLeadStage;

  @Column({ type: 'varchar', name: 'responsavel_nome', length: 180, nullable: true })
  responsavelNome: string | null;

  @Column({ name: 'responsavel_usuario_id', type: 'uuid', nullable: true })
  responsavelUsuarioId: string | null;

  @Column({ name: 'valor_potencial', type: 'decimal', precision: 12, scale: 2, default: 0 })
  valorPotencial: string;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  @Column({ default: true })
  ativo: boolean;
}
