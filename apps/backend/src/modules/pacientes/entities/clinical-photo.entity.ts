import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Paciente } from './paciente.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum ClinicalPhotoType {
  FOTO_POSTURAL_FRONTAL = 'FOTO_POSTURAL_FRONTAL',
  FOTO_POSTURAL_POSTERIOR = 'FOTO_POSTURAL_POSTERIOR',
  FOTO_POSTURAL_LATERAL_DIREITA = 'FOTO_POSTURAL_LATERAL_DIREITA',
  FOTO_POSTURAL_LATERAL_ESQUERDA = 'FOTO_POSTURAL_LATERAL_ESQUERDA',
  FOTO_MOVIMENTO_ADM = 'FOTO_MOVIMENTO_ADM',
  FOTO_EVOLUCAO_BASELINE = 'FOTO_EVOLUCAO_BASELINE',
  FOTO_EVOLUCAO_FOLLOWUP = 'FOTO_EVOLUCAO_FOLLOWUP',
}

export enum ClinicalPhotoView {
  ANTERIOR = 'ANTERIOR',
  POSTERIOR = 'POSTERIOR',
  LATERAL_DIREITA = 'LATERAL_DIREITA',
  LATERAL_ESQUERDA = 'LATERAL_ESQUERDA',
  MOVIMENTO = 'MOVIMENTO',
}

@Entity('clinical_photos')
@Index('idx_clinical_photos_paciente_created', ['pacienteId', 'createdAt'])
@Index('idx_clinical_photos_usuario_created', ['usuarioId', 'createdAt'])
@Index('idx_clinical_photos_tipo', ['tipo'])
export class ClinicalPhoto extends BaseEntity {
  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'nome_original', length: 255 })
  nomeOriginal: string;

  @Column({ name: 'nome_arquivo', length: 255 })
  nomeArquivo: string;

  @Column({ name: 'mime_type', length: 120 })
  mimeType: string;

  @Column({ name: 'tamanho_bytes', type: 'integer' })
  tamanhoBytes: number;

  @Column({ name: 'caminho_arquivo', length: 500 })
  caminhoArquivo: string;

  @Column({ name: 'tipo', type: 'varchar', length: 80 })
  tipo: ClinicalPhotoType;

  @Column({ name: 'vista', type: 'varchar', length: 60, nullable: true })
  vista: ClinicalPhotoView | null;

  @Column({ name: 'regiao', type: 'varchar', length: 120, nullable: true })
  regiao: string | null;

  @Column({ name: 'lado', type: 'varchar', length: 40, nullable: true })
  lado: string | null;

  @Column({ name: 'intensidade_dor', type: 'integer', nullable: true })
  intensidadeDor: number | null;

  @Column({ name: 'observacao', type: 'text', nullable: true })
  observacao: string | null;

  @Column({ name: 'data_foto', type: 'date', nullable: true })
  dataFoto: Date | null;

  @Column({ name: 'quality_score', type: 'integer', nullable: true })
  qualityScore: number | null;

  @Column({ name: 'ai_analise', type: 'text', nullable: true })
  aiAnalise: string | null;

  @Column({ name: 'ai_limites', type: 'text', nullable: true })
  aiLimites: string | null;

  @Column({ name: 'ai_raw', type: 'jsonb', nullable: true })
  aiRaw: Record<string, unknown> | null;

  @Column({
    name: 'confirmado_por_profissional',
    type: 'boolean',
    default: false,
  })
  confirmadoPorProfissional: boolean;
}
