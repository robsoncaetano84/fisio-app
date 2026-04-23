import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ClinicalAuditActionType = 'READ' | 'EDIT' | 'APPROVAL';

@Entity('clinical_audit_logs')
@Index('idx_clinical_audit_logs_actor_created', ['actorId', 'createdAt'])
@Index('idx_clinical_audit_logs_action_created', ['actionType', 'createdAt'])
@Index('idx_clinical_audit_logs_patient_created', ['patientId', 'createdAt'])
export class ClinicalAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ name: 'actor_role', type: 'varchar', length: 40, nullable: true })
  actorRole: string | null;

  @Column({ name: 'patient_id', type: 'uuid', nullable: true })
  patientId: string | null;

  @Column({ name: 'action_type', type: 'varchar', length: 20 })
  actionType: ClinicalAuditActionType;

  @Column({ type: 'varchar', length: 80 })
  action: string;

  @Column({ name: 'resource_type', type: 'varchar', length: 80, nullable: true })
  resourceType: string | null;

  @Column({ name: 'resource_id', type: 'varchar', length: 120, nullable: true })
  resourceId: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

