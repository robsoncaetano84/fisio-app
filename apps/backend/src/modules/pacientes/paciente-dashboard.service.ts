import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Atividade } from '../atividades/entities/atividade.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Laudo, LaudoStatus } from '../laudos/entities/laudo.entity';
import { PacienteScopeService } from './paciente-scope.service';

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
  ) {}

  async getAttentionMap(
    usuarioId: string,
    isMasterAdmin = false,
  ): Promise<Record<string, number | null>> {
    const rowsQuery = this.pacienteScopeService.buildScopedAttentionRowsQuery(
      usuarioId,
      isMasterAdmin,
      this.evolucaoRepository.metadata.tableName,
    );

    const rows = await rowsQuery.getRawMany<{
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
        lastLaudo?.status === LaudoStatus.VALIDADO_PROFISSIONAL &&
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
    const total = await this.pacienteScopeService
      .buildScopedPacientesQuery(usuarioId, isMasterAdmin)
      .getCount();

    return {
      totalPacientes: total,
      atendidosHoje: 0,
      atendidosMes: 0,
    };
  }
}
