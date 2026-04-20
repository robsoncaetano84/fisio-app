import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('patient_check_click_events')
@Index('idx_patient_check_click_events_prof_occurred_at', ['professionalId', 'occurredAt'])
export class PatientCheckClickEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'professional_id', type: 'uuid' })
  professionalId: string;

  @Column({ name: 'patient_id', type: 'uuid', nullable: true })
  patientId: string | null;

  @Column({ name: 'source', type: 'varchar', length: 40, nullable: true })
  source: string | null;

  @Column({ name: 'occurred_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  occurredAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

