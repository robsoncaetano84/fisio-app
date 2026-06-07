import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CrmAutomationActionType {
  TASK_OVERDUE = 'TASK_OVERDUE',
  LEAD_STALE = 'LEAD_STALE',
  PATIENT_NO_EVOLUTION = 'PATIENT_NO_EVOLUTION',
  PATIENT_NO_CHECKIN = 'PATIENT_NO_CHECKIN',
  PENDING_ANAMNESIS = 'PENDING_ANAMNESIS',
  PENDING_INVITE = 'PENDING_INVITE',
  LOW_ACTIVATION_ACCOUNT = 'LOW_ACTIVATION_ACCOUNT',
}

export enum CrmAutomationSeverity {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
}

export enum CrmAutomationTargetType {
  TASK = 'TASK',
  LEAD = 'LEAD',
  PATIENT = 'PATIENT',
  PROFESSIONAL = 'PROFESSIONAL',
}

export enum CrmAutomationStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  SNOOZED = 'SNOOZED',
  DONE = 'DONE',
  DISMISSED = 'DISMISSED',
}

export enum CrmAutomationHistoryEventType {
  CREATED = 'CREATED',
  SEEN = 'SEEN',
  STATUS_CHANGED = 'STATUS_CHANGED',
  SLA_CHANGED = 'SLA_CHANGED',
  ASSIGNED = 'ASSIGNED',
  NOTE_ADDED = 'NOTE_ADDED',
}

export type CrmAutomationHistoryEvent = {
  type: CrmAutomationHistoryEventType;
  at: string;
  actorUsuarioId?: string | null;
  fromStatus?: CrmAutomationStatus | null;
  toStatus?: CrmAutomationStatus | null;
  fromResponsavelUsuarioId?: string | null;
  toResponsavelUsuarioId?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
};

@Entity('crm_automation_actions')
@Index('idx_crm_automation_actions_source_key', ['sourceKey'], {
  unique: true,
})
@Index('idx_crm_automation_actions_status_sla', ['status', 'slaDueAt'])
@Index('idx_crm_automation_actions_type_status', ['type', 'status'])
@Index('idx_crm_automation_actions_target', ['targetType', 'targetId'])
@Index('idx_crm_automation_actions_responsavel_status_sla', [
  'responsavelUsuarioId',
  'status',
  'slaDueAt',
])
export class CrmAutomationAction extends BaseEntity {
  @Column({ name: 'source_key', type: 'varchar', length: 180 })
  sourceKey: string;

  @Column({ type: 'enum', enum: CrmAutomationActionType })
  type: CrmAutomationActionType;

  @Column({ type: 'enum', enum: CrmAutomationSeverity })
  severity: CrmAutomationSeverity;

  @Column({
    type: 'enum',
    enum: CrmAutomationStatus,
    default: CrmAutomationStatus.OPEN,
  })
  status: CrmAutomationStatus;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'cta_label', type: 'varchar', length: 80 })
  ctaLabel: string;

  @Column({ name: 'target_type', type: 'enum', enum: CrmAutomationTargetType })
  targetType: CrmAutomationTargetType;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @Column({ name: 'responsavel_usuario_id', type: 'uuid', nullable: true })
  responsavelUsuarioId: string | null;

  @Column({ name: 'sla_due_at', type: 'timestamp', nullable: true })
  slaDueAt: Date | null;

  @Column({ name: 'first_seen_at', type: 'timestamp' })
  firstSeenAt: Date;

  @Column({ name: 'last_seen_at', type: 'timestamp' })
  lastSeenAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'history', type: 'jsonb', default: [] })
  history: CrmAutomationHistoryEvent[];
}
