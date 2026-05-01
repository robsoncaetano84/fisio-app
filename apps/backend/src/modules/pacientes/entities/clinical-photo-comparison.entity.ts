import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Paciente } from './paciente.entity';
import { ClinicalPhoto } from './clinical-photo.entity';

@Entity('clinical_photo_comparisons')
@Index('idx_clinical_photo_comparisons_paciente_created', [
  'pacienteId',
  'createdAt',
])
export class ClinicalPhotoComparison extends BaseEntity {
  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @ManyToOne(() => ClinicalPhoto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'baseline_photo_id' })
  baselinePhoto: ClinicalPhoto;

  @ManyToOne(() => ClinicalPhoto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followup_photo_id' })
  followupPhoto: ClinicalPhoto;

  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'baseline_photo_id', type: 'uuid' })
  baselinePhotoId: string;

  @Column({ name: 'followup_photo_id', type: 'uuid' })
  followupPhotoId: string;

  @Column({ name: 'regiao', type: 'varchar', length: 120, nullable: true })
  regiao: string | null;

  @Column({ name: 'vista', type: 'varchar', length: 60, nullable: true })
  vista: string | null;

  @Column({ name: 'observacao', type: 'text', nullable: true })
  observacao: string | null;

  @Column({ name: 'resumo', type: 'text', nullable: true })
  resumo: string | null;

  @Column({ name: 'ai_comparacao', type: 'text', nullable: true })
  aiComparacao: string | null;

  @Column({ name: 'ai_limites', type: 'text', nullable: true })
  aiLimites: string | null;

  @Column({ name: 'ai_raw', type: 'jsonb', nullable: true })
  aiRaw: Record<string, unknown> | null;

  @Column({ name: 'confirmado_por_profissional', type: 'boolean', default: false })
  confirmadoPorProfissional: boolean;
}
