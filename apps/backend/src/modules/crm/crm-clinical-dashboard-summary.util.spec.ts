import {
  buildCrmClinicalDashboardSummary,
  buildEmptyCrmClinicalDashboardSummary,
} from './crm-clinical-dashboard-summary.util';

describe('crm clinical dashboard summary util', () => {
  const now = new Date('2026-05-13T12:00:00.000Z').getTime();

  it('returns the empty dashboard shape', () => {
    expect(buildEmptyCrmClinicalDashboardSummary()).toMatchObject({
      pipeline: {
        novoPaciente: 0,
        aguardandoVinculo: 0,
        anamnesePendente: 0,
        emTratamento: 0,
        alta: 0,
      },
      alertas: {
        semCheckin: 0,
        semEvolucao: 0,
        conviteNaoAceito: 0,
      },
      metricas: {
        abandonoRate: 0,
        conclusaoPlanoRate: 0,
        pacientesEmAtencao: 0,
        abandonedTotal: 0,
        blockedTotal: 0,
        autosaveTotal: 0,
        topBlockedReasons: [],
      },
    });
  });

  it('aggregates pipeline, alerts and flow metrics', () => {
    const summary = buildCrmClinicalDashboardSummary({
      now,
      windowDays: 7,
      semEvolucaoDias: 10,
      patients: [
        {
          id: 'novo',
          createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
          hasAnamnese: false,
          hasAltaDocumento: false,
          hasActiveActivity: false,
          aguardandoVinculo: true,
          conviteEnviado: true,
        },
        {
          id: 'tratamento',
          createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
          hasAnamnese: true,
          lastEvolucaoAt: new Date(now - 15 * 24 * 60 * 60 * 1000),
          hasAltaDocumento: false,
          hasActiveActivity: true,
          lastCheckinAt: new Date(now - 9 * 24 * 60 * 60 * 1000),
          aguardandoVinculo: false,
          conviteEnviado: false,
        },
        {
          id: 'alta',
          createdAt: new Date(now - 40 * 24 * 60 * 60 * 1000),
          hasAnamnese: true,
          lastEvolucaoAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
          lastLaudoUpdatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
          hasAltaDocumento: true,
          hasActiveActivity: false,
          aguardandoVinculo: false,
          conviteEnviado: false,
        },
      ],
      flowRows: [
        {
          stage: 'ANAMNESE',
          avgDuration: '1000',
          opened: '10',
          abandoned: '2',
          completed: '7',
          blocked: '1',
          autosaved: '4',
        },
      ],
      blockedReasonRows: [
        { reason: 'MISSING_ANAMNESE', count: '2' },
        { reason: 'MISSING_REQUIRED_FIELDS', count: '1' },
      ],
    });

    expect(summary.pipeline).toEqual({
      novoPaciente: 1,
      aguardandoVinculo: 1,
      anamnesePendente: 1,
      emTratamento: 1,
      alta: 1,
    });
    expect(summary.alertas).toMatchObject({
      semCheckin: 1,
      semEvolucao: 2,
      conviteNaoAceito: 1,
    });
    expect(summary.metricas).toMatchObject({
      abandonoRate: 20,
      conclusaoPlanoRate: 33.3,
      pacientesEmAtencao: 2,
      abandonedTotal: 2,
      completedTotal: 7,
      blockedTotal: 1,
      autosaveTotal: 4,
    });
    expect(summary.metricas.eventosPorEtapa.ANAMNESE).toMatchObject({
      opened: 10,
      abandoned: 2,
      completed: 7,
      blocked: 1,
      autosaved: 4,
    });
    expect(summary.metricas.topBlockedReasons[0]).toEqual({
      reason: 'MISSING_ANAMNESE',
      count: 2,
    });
  });

  it('applies the optional operational status filter', () => {
    const summary = buildCrmClinicalDashboardSummary({
      now,
      windowDays: 7,
      semEvolucaoDias: 10,
      statusFilter: 'ALTA',
      patients: [
        {
          id: 'tratamento',
          createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
          hasAnamnese: true,
          hasAltaDocumento: false,
          hasActiveActivity: true,
          aguardandoVinculo: false,
          conviteEnviado: false,
        },
        {
          id: 'alta',
          createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
          hasAnamnese: true,
          hasAltaDocumento: true,
          hasActiveActivity: false,
          aguardandoVinculo: false,
          conviteEnviado: false,
        },
      ],
      flowRows: [],
    });

    expect(summary.pipeline).toMatchObject({
      emTratamento: 0,
      alta: 1,
    });
    expect(summary.metricas.conclusaoPlanoRate).toBe(50);
  });
});
