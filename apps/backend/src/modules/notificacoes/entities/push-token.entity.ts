// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// P US H T OK EN.E NT IT Y
// ==========================================
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('push_tokens')
@Index('UQ_PUSH_TOKENS_EXPO_TOKEN', ['expoPushToken'], { unique: true })
@Index('IDX_PUSH_TOKENS_USUARIO', ['usuarioId'])
export class PushToken extends BaseEntity {
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'expo_push_token', type: 'varchar', length: 255 })
  expoPushToken: string;

  @Column({ name: 'plataforma', type: 'varchar', length: 20, nullable: true })
  plataforma: string | null;

  @Column({ name: 'app_version', type: 'varchar', length: 40, nullable: true })
  appVersion: string | null;

  @Column({ name: 'ativo', type: 'boolean', default: true })
  ativo: boolean;

  @Column({ name: 'ultimo_envio_em', type: 'timestamp', nullable: true })
  ultimoEnvioEm: Date | null;
}

