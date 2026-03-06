// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// A UT H L OG S.S ER VI CE
// ==========================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthEventType, AuthLog } from './entities/auth-log.entity';

@Injectable()
export class AuthLogsService {
  constructor(
    @InjectRepository(AuthLog)
    private readonly authLogRepository: Repository<AuthLog>,
  ) {}

  async record(params: {
    email: string;
    eventType: AuthEventType;
    success: boolean;
    ip?: string;
    usuarioId?: string;
    reason?: string;
  }) {
    const log = this.authLogRepository.create(params);
    return this.authLogRepository.save(log);
  }
}
