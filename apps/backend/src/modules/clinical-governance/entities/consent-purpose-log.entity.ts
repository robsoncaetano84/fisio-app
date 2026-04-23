import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ConsentPurpose =
  | 'TERMS_REQUIRED'
  | 'PRIVACY_REQUIRED'
  | 'RESEARCH_OPTIONAL'
  | 'AI_OPTIONAL'
  | 'PROFESSIONAL_LGPD_REQUIRED';

@Entity('consent_purpose_logs')
@Index('idx_consent_purpose_logs_user_created', ['userId', 'createdAt'])
@Index('idx_consent_purpose_logs_purpose_created', ['purpose', 'createdAt'])
export class ConsentPurposeLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 60 })
  purpose: ConsentPurpose;

  @Column({ name: 'accepted', type: 'boolean', default: false })
  accepted: boolean;

  @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
  acceptedAt: Date | null;

  @Column({ name: 'protocol_version', type: 'varchar', length: 40, nullable: true })
  protocolVersion: string | null;

  @Column({ type: 'varchar', length: 40, default: 'APP' })
  source: string;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

