import { buildCrmCommandCenterSummary } from './crm-command-center.util';

describe('crm command center util', () => {
  const now = new Date('2026-06-07T12:00:00.000Z').getTime();
  const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000);

  it('builds operational kpis and prioritized actions', () => {
    const summary = buildCrmCommandCenterSummary({
      now,
      windowDays: 7,
      semEvolucaoDias: 10,
      limit: 8,
      overdueTasks: [
        {
          id: 'task-1',
          titulo: 'Retornar lead Igor',
          dueAt: daysAgo(2),
          leadId: 'lead-1',
          responsavelNome: 'Admin',
        },
      ],
      staleLeads: [
        {
          id: 'lead-1',
          nome: 'Clinica Movimento',
          stage: 'PROPOSTA',
          updatedAt: daysAgo(8),
          responsavelNome: 'Admin',
        },
      ],
      patients: [
        {
          id: 'patient-risk',
          nomeCompleto: 'Paciente em risco',
          profissionalNome: 'Igor',
          createdAt: daysAgo(30),
          hasAnamnese: true,
          lastEvolucaoAt: daysAgo(15),
          hasActiveActivity: true,
          lastCheckinAt: daysAgo(9),
          tratamentoConcluido: false,
          conviteEnviado: false,
        },
        {
          id: 'patient-anamnese',
          nomeCompleto: 'Paciente sem anamnese',
          profissionalNome: 'Igor',
          createdAt: daysAgo(8),
          hasAnamnese: false,
          hasActiveActivity: false,
          tratamentoConcluido: false,
          conviteEnviado: false,
        },
        {
          id: 'patient-invite',
          nomeCompleto: 'Paciente sem app',
          profissionalNome: 'Igor',
          createdAt: daysAgo(20),
          hasAnamnese: true,
          lastEvolucaoAt: daysAgo(2),
          hasActiveActivity: false,
          tratamentoConcluido: false,
          conviteEnviado: true,
          conviteEnviadoEm: daysAgo(10),
        },
      ],
      professionals: [
        {
          id: 'professional-1',
          nome: 'Profissional sem ativacao',
          pacientesTotal: 0,
          pacientesAtivos: 0,
          lastPacienteUpdate: null,
        },
      ],
    });

    expect(summary.kpis).toMatchObject({
      totalOpenActions: 7,
      highPriorityActions: 6,
      overdueTasks: 1,
      staleLeads: 1,
      patientsWithoutEvolution: 1,
      patientsWithoutCheckin: 1,
      pendingAnamnesis: 1,
      pendingInvites: 1,
      lowActivationAccounts: 1,
    });
    expect(summary.nextActions.map((item) => item.type)).toEqual(
      expect.arrayContaining([
        'TASK_OVERDUE',
        'LEAD_STALE',
        'PATIENT_NO_EVOLUTION',
        'PATIENT_NO_CHECKIN',
        'PENDING_ANAMNESIS',
        'PENDING_INVITE',
        'LOW_ACTIVATION_ACCOUNT',
      ]),
    );
    expect(
      summary.nextActions.slice(0, 6).every((item) => item.severity === 'HIGH'),
    ).toBe(true);
  });

  it('does not raise clinical follow-up for concluded treatment', () => {
    const summary = buildCrmCommandCenterSummary({
      now,
      windowDays: 7,
      semEvolucaoDias: 10,
      limit: 8,
      overdueTasks: [],
      staleLeads: [],
      patients: [
        {
          id: 'patient-done',
          nomeCompleto: 'Paciente alta',
          createdAt: daysAgo(60),
          hasAnamnese: true,
          lastEvolucaoAt: daysAgo(40),
          hasActiveActivity: false,
          lastCheckinAt: daysAgo(40),
          tratamentoConcluido: true,
          conviteEnviado: false,
        },
      ],
      professionals: [],
    });

    expect(summary.kpis.totalOpenActions).toBe(0);
    expect(summary.nextActions).toHaveLength(0);
  });
});
