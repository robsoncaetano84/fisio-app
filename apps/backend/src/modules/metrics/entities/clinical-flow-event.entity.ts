import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ClinicalFlowStage = 'ANAMNESE' | 'EXAME_FISICO' | 'EVOLUCAO';
export type ClinicalFlowEventType =
  | 'STAGE_OPENED'
  | 'STAGE_COMPLETED'
  | 'STAGE_ABANDONED'
  | 'STAGE_BLOCKED';

@Entity('clinical_flow_events')
@Index('idx_clinical_flow_events_prof_occurred_at', ['professionalId', 'occurredAt'])
export class ClinicalFlowEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'professional_id', type: 'uuid' })
  professionalId: string;

  @Column({ name: 'patient_id', type: 'uuid', nullable: true })
  patientId: string | null;

  @Column({ name: 'stage', type: 'varchar', length: 32 })
  stage: ClinicalFlowStage;

  @Column({ name: 'event_type', type: 'varchar', length: 32 })
  eventType: ClinicalFlowEventType;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number | null;

  @Column({ name: 'blocked_reason', type: 'varchar', length: 80, nullable: true })
  blockedReason: string | null;

  @Column({ name: 'occurred_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  occurredAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

