// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// H EA LT H.S ER VI CE
// ==========================================
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async check() {
    const startedAt = Date.now();
    let db: 'up' | 'down' = 'up';
    let dbError: string | null = null;

    try {
      await this.dataSource.query('SELECT 1');
    } catch (error) {
      db = 'down';
      dbError =
        error instanceof Error ? error.message : 'Erro desconhecido no banco';
    }

    return {
      status: db === 'up' ? 'ok' : 'degraded',
      service: 'fisio-backend',
      version: (process.env.APP_VERSION || '').trim() || null,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      responseTimeMs: Date.now() - startedAt,
      checks: {
        db: {
          status: db,
          error: dbError,
        },
      },
    };
  }
}
