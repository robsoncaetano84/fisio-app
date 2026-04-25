// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// H EA LT H.SERVICE
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
    const appVersion = (
      process.env.APP_VERSION ||
      process.env.npm_package_version ||
      ''
    ).trim();

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
      version: appVersion || null,
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
    const [pendingRows, semAnamneseRows, semEvolucaoRows, exames24hRows] =
      await Promise.all([
        this.dataSource.query(`
          SELECT COUNT(*)::int AS total
          FROM pacientes p
          WHERE p.ativo = true
            AND p.anamnese_solicitacao_pendente = true
        `),
        this.dataSource.query(`
          SELECT COUNT(*)::int AS total
          FROM pacientes p
          WHERE p.ativo = true
            AND NOT EXISTS (
              SELECT 1
              FROM anamneses a
              WHERE a.paciente_id = p.id
            )
        `),
        this.dataSource.query(`
          SELECT COUNT(*)::int AS total
          FROM pacientes p
          WHERE p.ativo = true
            AND NOT EXISTS (
              SELECT 1
              FROM evolucoes e
              WHERE e.paciente_id = p.id
            )
        `),
        this.dataSource.query(`
          SELECT COUNT(*)::int AS total
          FROM paciente_exames pe
          WHERE pe.created_at >= NOW() - INTERVAL '24 hours'
        `),
      ]);

    return {
      timestamp: new Date().toISOString(),
      metrics: {
        solicitacoesAnamnesePendentes: Number(pendingRows?.[0]?.total || 0),
        pacientesSemAnamnese: Number(semAnamneseRows?.[0]?.total || 0),
        pacientesSemEvolucao: Number(semEvolucaoRows?.[0]?.total || 0),
        uploadsExamesUltimas24h: Number(exames24hRows?.[0]?.total || 0),
      },
    };
  }
}
