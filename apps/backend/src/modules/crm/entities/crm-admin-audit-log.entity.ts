import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('crm_admin_audit_logs')
@Index('idx_crm_admin_audit_logs_actor_created', ['actorId', 'createdAt'])
@Index('idx_crm_admin_audit_logs_action_created', ['action', 'createdAt'])
export class CrmAdminAuditLog extends BaseEntity {
  @Column({ name: 'actor_id', type: 'uuid' })
  actorId: string;

  @Column({ name: 'actor_email', type: 'varchar', length: 255 })
  actorEmail: string;

  @Column({ name: 'action', type: 'varchar', length: 120 })
  action: string;

  @Column({ name: 'include_sensitive', type: 'boolean', default: false })
  includeSensitive: boolean;

  @Column({ name: 'sensitive_reason', type: 'varchar', length: 255, nullable: true })
  sensitiveReason: string | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;
}

