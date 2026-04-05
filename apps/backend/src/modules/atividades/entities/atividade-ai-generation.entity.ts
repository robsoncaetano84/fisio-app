import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('atividade_ai_generations')
@Unique('uq_atividade_ai_generations_paciente_dia', ['pacienteId', 'generatedOn'])
export class AtividadeAiGeneration extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  @Column({ name: 'generated_on', type: 'date' })
  generatedOn: string;

  @Column({ name: 'input_hash', type: 'varchar', length: 64 })
  inputHash: string;

  @Column({ type: 'varchar', length: 140 })
  titulo: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  referencias: string[];

  @Column({ type: 'varchar', length: 16, nullable: true })
  source: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  model: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}
