import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../../common/redis.service';
import { Atividade } from '../atividades/entities/atividade.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Laudo, LaudoStatus } from '../laudos/entities/laudo.entity';
import { PacienteScopeService } from './paciente-scope.service';

const HEAVY_READ_LIMIT = 5000;

@Injectable()
export class PacienteDashboardService {
  constructor(
    @InjectRepository(Evolucao)
    private readonly evolucaoRepository: Repository<Evolucao>,
    @InjectRepository(Laudo)
    private readonly laudoRepository: Repository<Laudo>,
    @InjectRepository(Atividade)
    private readonly atividadeRepository: Repository<Atividade>,
    private readonly pacienteScopeService: PacienteScopeService,
    @Optional()
    private readonly redisService?: RedisService,
  ) {}

  async getAttentionMap(
    usuarioId: string,
    isMasterAdmin = false,
  ): Promise<Record<string, number | null>> {
    return this.rememberCache(
      this.buildCacheKey('pacientes:dashboard:attention-map', {
        usuarioId,
        isMasterAdmin,
      }),
      this.getCacheTtlSeconds(true),
      () => this.getAttentionMapFromDatabase(usuarioId, isMasterAdmin),
    );
  }

  private async getAttentionMapFromDatabase(
    usuarioId: string,
    isMasterAdmin = false,
  ): Promise<Record<string, number | null>> {
    const rowsQuery = this.pacienteScopeService.buildScopedAttentionRowsQuery(
      usuarioId,
      isMasterAdmin,
      this.evolucaoRepository.metadata.tableName,
    );

    const rows = await rowsQuery.take(HEAVY_READ_LIMIT).getRawMany<{
      pacienteId: string;
      createdAt: string | null;
      lastEvolucaoAt: string | null;
    }>();

    const pacienteIds = rows.map((row) => row.pacienteId);
    const latestLaudos = pacienteIds.length
      ? await this.laudoRepository
          .createQueryBuilder('l')
          .where('l.pacienteId IN (:...pacienteIds)', { pacienteIds })
          .orderBy('l.pacienteId', 'ASC')
          .addOrderBy('l.updatedAt', 'DESC')
          .getMany()
      : [];
    const laudoByPaciente = new Map<string, Laudo>();
    latestLaudos.forEach((item) => {
      if (!laudoByPaciente.has(item.pacienteId)) {
        laudoByPaciente.set(item.pacienteId, item);
      }
    });

    const pacientesComAtividadeAtiva = pacienteIds.length
      ? await this.atividadeRepository
          .createQueryBuilder('a')
          .select('a.pacienteId', 'pacienteId')
          .where('a.ativo = :ativo', { ativo: true })
          .andWhere('a.pacienteId IN (:...pacienteIds)', { pacienteIds })
          .groupBy('a.pacienteId')
          .getRawMany<{ pacienteId: string }>()
      : [];
    const atividadePacienteIds = new Set(
      pacientesComAtividadeAtiva.map((row) => row.pacienteId),
    );

    const now = Date.now();
    const result: Record<string, number | null> = {};

    for (const row of rows) {
      const lastLaudo = laudoByPaciente.get(row.pacienteId);
      const hasAltaDocumento =
        (lastLaudo?.status === LaudoStatus.VALIDADO_PROFISSIONAL ||
          lastLaudo?.status === LaudoStatus.PUBLICADO_PACIENTE) &&
        !!lastLaudo.criteriosAlta;
      const hasActiveActivity = atividadePacienteIds.has(row.pacienteId);
      const tratamentoConcluido = hasAltaDocumento && !hasActiveActivity;

      if (tratamentoConcluido) {
        result[row.pacienteId] = 0;
        continue;
      }

      if (!row.lastEvolucaoAt) {
        const createdAt = row.createdAt
          ? new Date(row.createdAt).getTime()
          : NaN;
        if (Number.isNaN(createdAt)) {
          result[row.pacienteId] = null;
          continue;
        }

        const daysSinceCreation = Math.floor(
          (now - createdAt) / (1000 * 60 * 60 * 24),
        );
        result[row.pacienteId] = daysSinceCreation > 7 ? null : 0;
        continue;
      }

      const latest = new Date(row.lastEvolucaoAt).getTime();
      if (Number.isNaN(latest)) {
        result[row.pacienteId] = null;
        continue;
      }

      result[row.pacienteId] = Math.floor(
        (now - latest) / (1000 * 60 * 60 * 24),
      );
    }

    return result;
  }

  async getStats(usuarioId: string, isMasterAdmin = false) {
    return this.rememberCache(
      this.buildCacheKey('pacientes:dashboard:stats', {
        usuarioId,
        isMasterAdmin,
      }),
      this.getCacheTtlSeconds(false),
      () => this.getStatsFromDatabase(usuarioId, isMasterAdmin),
    );
  }

  private async getStatsFromDatabase(usuarioId: string, isMasterAdmin = false) {
    const total = await this.pacienteScopeService
      .buildScopedPacientesQuery(usuarioId, isMasterAdmin)
      .getCount();

    return {
      totalPacientes: total,
      atendidosHoje: 0,
      atendidosMes: 0,
    };
  }

  private async rememberCache<T>(
    key: string,
    ttlSeconds: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    if (!this.redisService) return factory();
    return this.redisService.remember(key, ttlSeconds, factory);
  }

  private getCacheTtlSeconds(heavy: boolean): number {
    const envKey = heavy ? 'CACHE_HEAVY_TTL_SECONDS' : 'CACHE_TTL_SECONDS';
    const raw = Number(process.env[envKey] || (heavy ? 120 : 60));
    return Number.isFinite(raw) ? Math.max(1, Math.floor(raw)) : 60;
  }

  private buildCacheKey(prefix: string, value: unknown): string {
    return `${prefix}:${this.hashCacheValue(this.stableStringify(value))}`;
  }

  private stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      return `{${Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => `${key}:${this.stableStringify(item)}`)
        .join(',')}}`;
    }
    return JSON.stringify(value);
  }

  private hashCacheValue(value: string): string {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) | 0;
    }
    return Math.abs(hash).toString(36);
  }
}
