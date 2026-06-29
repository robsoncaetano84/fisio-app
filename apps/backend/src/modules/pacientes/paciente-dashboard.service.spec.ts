import { LaudoStatus } from '../laudos/entities/laudo.entity';
import { PacienteDashboardService } from './paciente-dashboard.service';

describe('PacienteDashboardService', () => {
  const makeQueryBuilder = ({
    rawMany = [],
    many = [],
    count = 0,
  }: {
    rawMany?: unknown[];
    many?: unknown[];
    count?: number;
  } = {}) => ({
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rawMany),
    getMany: jest.fn().mockResolvedValue(many),
    getCount: jest.fn().mockResolvedValue(count),
  });

  const makeService = ({
    attentionBuilder = makeQueryBuilder(),
    statsBuilder = makeQueryBuilder(),
    laudoBuilder = makeQueryBuilder(),
    atividadeBuilder = makeQueryBuilder(),
  } = {}) => {
    const evolucaoRepository = {
      metadata: { tableName: 'evolucoes' },
    };
    const laudoRepository = {
      createQueryBuilder: jest.fn(() => laudoBuilder),
    };
    const atividadeRepository = {
      createQueryBuilder: jest.fn(() => atividadeBuilder),
    };
    const pacienteScopeService = {
      buildScopedAttentionRowsQuery: jest.fn(() => attentionBuilder),
      buildScopedPacientesQuery: jest.fn(() => statsBuilder),
    };
    const service = new PacienteDashboardService(
      evolucaoRepository as any,
      laudoRepository as any,
      atividadeRepository as any,
      pacienteScopeService as any,
    );

    return {
      service,
      laudoRepository,
      atividadeRepository,
      pacienteScopeService,
      attentionBuilder,
      statsBuilder,
      laudoBuilder,
      atividadeBuilder,
    };
  };

  it('calculates attention by discharge, last evolution and creation date', async () => {
    const attentionBuilder = makeQueryBuilder({
      rawMany: [
        {
          pacienteId: 'alta',
          createdAt: '2025-12-01T00:00:00.000Z',
          lastEvolucaoAt: null,
        },
        {
          pacienteId: 'novo',
          createdAt: '2026-01-08T00:00:00.000Z',
          lastEvolucaoAt: null,
        },
        {
          pacienteId: 'antigo',
          createdAt: '2025-12-20T00:00:00.000Z',
          lastEvolucaoAt: null,
        },
        {
          pacienteId: 'evoluiu',
          createdAt: '2025-12-01T00:00:00.000Z',
          lastEvolucaoAt: '2026-01-05T00:00:00.000Z',
        },
        {
          pacienteId: 'sem-data',
          createdAt: null,
          lastEvolucaoAt: null,
        },
      ],
    });
    const laudoBuilder = makeQueryBuilder({
      many: [
        {
          pacienteId: 'alta',
          status: LaudoStatus.VALIDADO_PROFISSIONAL,
          criteriosAlta: 'criterios atingidos',
        },
      ],
    });
    const atividadeBuilder = makeQueryBuilder({ rawMany: [] });
    const { service, pacienteScopeService } = makeService({
      attentionBuilder,
      laudoBuilder,
      atividadeBuilder,
    });
    const dateNow = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-01-10T00:00:00.000Z').getTime());

    const result = await service.getAttentionMap('profissional-1', false);
    dateNow.mockRestore();

    expect(result).toEqual({
      alta: 0,
      novo: 0,
      antigo: null,
      evoluiu: 5,
      'sem-data': null,
    });
    expect(
      pacienteScopeService.buildScopedAttentionRowsQuery,
    ).toHaveBeenCalledWith('profissional-1', false, 'evolucoes');
  });

  it('does not query reports or activities when there are no patients', async () => {
    const attentionBuilder = makeQueryBuilder({ rawMany: [] });
    const { service, laudoRepository, atividadeRepository } = makeService({
      attentionBuilder,
    });

    await expect(
      service.getAttentionMap('profissional-1', true),
    ).resolves.toEqual({});
    expect(laudoRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(atividadeRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('builds scoped stats for non-master users', async () => {
    const statsBuilder = makeQueryBuilder({ count: 12 });
    const { service, pacienteScopeService } = makeService({ statsBuilder });

    await expect(service.getStats('profissional-1', false)).resolves.toEqual({
      totalPacientes: 12,
      atendidosHoje: 0,
      atendidosMes: 0,
    });
    expect(pacienteScopeService.buildScopedPacientesQuery).toHaveBeenCalledWith(
      'profissional-1',
      false,
    );
    expect(statsBuilder.getCount).toHaveBeenCalled();
  });
});
