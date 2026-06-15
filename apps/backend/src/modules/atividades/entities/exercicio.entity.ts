import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ExercicioMidia } from './exercicio-midia.entity';

export enum ExercicioStatus {
  RASCUNHO = 'RASCUNHO',
  APROVADO = 'APROVADO',
  ARQUIVADO = 'ARQUIVADO',
}

@Entity('exercicios')
@Index('UQ_EXERCICIO_SLUG', ['slug'], { unique: true })
@Index('IDX_EXERCICIO_FILTROS', ['regiaoCorporal', 'categoria', 'nivel'])
export class Exercicio extends BaseEntity {
  @Column({ length: 140 })
  nome: string;

  @Column({ length: 160 })
  slug: string;

  @Column({ name: 'regiao_corporal', type: 'varchar', length: 80 })
  regiaoCorporal: string;

  @Column({ type: 'varchar', length: 80 })
  categoria: string;

  @Column({ type: 'varchar', length: 40 })
  nivel: string;

  @Column({ type: 'text' })
  objetivo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ name: 'instrucoes_padrao', type: 'text' })
  instrucoesPadrao: string;

  @Column({ type: 'text', nullable: true })
  cuidados: string | null;

  @Column({ type: 'text', nullable: true })
  contraindicacoes: string | null;

  @Column({ name: 'imagem_key', type: 'varchar', length: 120, nullable: true })
  imagemKey: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tags: string[];

  @Column({
    type: 'varchar',
    length: 30,
    default: ExercicioStatus.APROVADO,
  })
  status: ExercicioStatus;

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

  @Column({ default: true })
  ativo: boolean;

  @OneToMany(() => ExercicioMidia, (midia) => midia.exercicio)
  midias: ExercicioMidia[];
}
