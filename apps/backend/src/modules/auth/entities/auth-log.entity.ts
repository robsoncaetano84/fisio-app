// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// A UT H L OG.E NT IT Y
// ==========================================
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum AuthEventType {
  LOGIN = 'LOGIN',
  REFRESH = 'REFRESH',
}

@Entity('auth_logs')
export class AuthLog extends BaseEntity {
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 64, nullable: true })
  ip?: string;

  @Column({ type: 'enum', enum: AuthEventType })
  eventType: AuthEventType;

  @Column({ default: false })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  reason?: string;
}
