import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('paciente_exames')
@Index('IDX_PACIENTE_EXAME_PACIENTE', ['pacienteId'])
@Index('IDX_PACIENTE_EXAME_USUARIO', ['usuarioId'])
export class PacienteExame extends BaseEntity {
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

  @Column({ name: 'tipo_exame', length: 120, nullable: true })
  tipoExame: string | null;

  @Column({ name: 'observacao', type: 'text', nullable: true })
  observacao: string | null;

  @Column({ name: 'data_exame', type: 'date', nullable: true })
  dataExame: Date | null;
}
