import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Exercicio } from './exercicio.entity';

export enum ExercicioMidiaRevisaoClinicaStatus {
  PENDENTE = 'PENDENTE',
  APROVADA = 'APROVADA',
  REGENERAR_IMAGEM = 'REGENERAR_IMAGEM',
  AJUSTAR_TEXTO = 'AJUSTAR_TEXTO',
  REMOVER_DO_CATALOGO = 'REMOVER_DO_CATALOGO',
}

@Entity('exercicio_midias')
@Index('IDX_EXERCICIO_MIDIA_EXERCICIO', ['exercicioId', 'ativo'])
@Index('UQ_EXERCICIO_MIDIA_ASSET', ['exercicioId', 'assetKey'], {
  unique: true,
})
export class ExercicioMidia extends BaseEntity {
  @ManyToOne(() => Exercicio, (exercicio) => exercicio.midias, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exercicio_id' })
  exercicio: Exercicio;

  @Column({ name: 'exercicio_id', type: 'uuid' })
  exercicioId: string;

  @Column({ name: 'asset_key', type: 'varchar', length: 120 })
  assetKey: string;

  @Column({ type: 'varchar', length: 40 })
  tipo: string;

  @Column({ name: 'source_type', type: 'varchar', length: 40 })
  sourceType: string;

  @Column({ name: 'source_url', type: 'text', nullable: true })
  sourceUrl: string | null;

  @Column({
    name: 'storage_path',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  storagePath: string | null;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl: string | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'mime_type', type: 'varchar', length: 80, nullable: true })
  mimeType: string | null;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ type: 'int', nullable: true })
  bytes: number | null;

  @Column({ type: 'varchar', length: 140, nullable: true })
  author: string | null;

  @Column({ type: 'varchar', length: 80 })
  license: string;

  @Column({ name: 'license_url', type: 'text', nullable: true })
  licenseUrl: string | null;

  @Column({ name: 'attribution_text', type: 'text', nullable: true })
  attributionText: string | null;

  @Column({ name: 'versao', type: 'int', default: 1 })
  versao: number;

  @Column({
    name: 'revisado_por_usuario_id',
    type: 'uuid',
    nullable: true,
  })
  revisadoPorUsuarioId: string | null;

  @Column({ name: 'revisado_em', type: 'timestamp', nullable: true })
  revisadoEm: Date | null;

  @Column({
    name: 'revisao_clinica_status',
    type: 'varchar',
    length: 40,
    default: ExercicioMidiaRevisaoClinicaStatus.PENDENTE,
  })
  revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus;

  @Column({ name: 'revisao_clinica_observacao', type: 'text', nullable: true })
  revisaoClinicaObservacao: string | null;

  @Column({
    name: 'revisao_clinica_por_usuario_id',
    type: 'uuid',
    nullable: true,
  })
  revisaoClinicaPorUsuarioId: string | null;

  @Column({ name: 'revisao_clinica_em', type: 'timestamp', nullable: true })
  revisaoClinicaEm: Date | null;

  @Column({ default: true })
  ativo: boolean;
}
