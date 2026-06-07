// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// H EA LT H.SERVICE
// ==========================================
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { isRecord } from '../../common/safe-json';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  getLiveness() {
    return {
      status: 'ok',
      service: 'fisio-backend',
      version: this.getAppVersion(),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

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
      version: this.getAppVersion(),
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

  async getOperationalMetrics() {
    const [
      solicitacoesAnamnesePendentes,
      pacientesSemAnamnese,
      pacientesSemEvolucao,
      uploadsExamesUltimas24h,
    ] = await Promise.all([
      this.queryCount(`
          SELECT COUNT(*)::int AS total
          FROM pacientes p
          WHERE p.ativo = true
            AND p.anamnese_solicitacao_pendente = true
        `),
      this.queryCount(`
          SELECT COUNT(*)::int AS total
          FROM pacientes p
          WHERE p.ativo = true
            AND NOT EXISTS (
              SELECT 1
              FROM anamneses a
              WHERE a.paciente_id = p.id
            )
        `),
      this.queryCount(`
          SELECT COUNT(*)::int AS total
          FROM pacientes p
          WHERE p.ativo = true
            AND NOT EXISTS (
              SELECT 1
              FROM evolucoes e
              WHERE e.paciente_id = p.id
            )
        `),
      this.queryCount(`
          SELECT COUNT(*)::int AS total
          FROM paciente_exames pe
          WHERE pe.created_at >= NOW() - INTERVAL '24 hours'
        `),
    ]);

    return {
      timestamp: new Date().toISOString(),
      metrics: {
        solicitacoesAnamnesePendentes,
        pacientesSemAnamnese,
        pacientesSemEvolucao,
        uploadsExamesUltimas24h,
      },
    };
  }

  private async queryCount(sql: string): Promise<number> {
    const rows: unknown = await this.dataSource.query(sql);
    if (!Array.isArray(rows)) return 0;

    const first = rows.find(isRecord);
    return Number(first?.total ?? 0) || 0;
  }

  private getAppVersion(): string | null {
    const appVersion = (
      process.env.APP_VERSION ||
      process.env.npm_package_version ||
      ''
    ).trim();

    return appVersion || null;
  }
}
