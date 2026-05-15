import { LaudoStatus } from '../laudos/entities/laudo.entity';
import { buildCharlesNextActionResponse } from './charles-next-action.util';

describe('buildCharlesNextActionResponse', () => {
  const paciente = {
    id: 'pac-1',
    nomeCompleto: 'Paciente Teste',
  };

  it('points to anamnesis when there is no clinical data', () => {
    const result = buildCharlesNextActionResponse({
      paciente,
      activeProtocol: {
        version: '1.0.0',
        name: 'Protocolo clinico base',
      },
    });

    expect(result.blocked).toBe(false);
    expect(result.protocolVersion).toBe('1.0.0');
    expect(result.nextAction.stage).toBe('ANAMNESE');
    expect(
      result.stages.find((stage) => stage.stage === 'ANAMNESE')?.status,
    ).toBe('PENDING');
  });

  it('blocks pending stages when anamnesis has a critical red flag', () => {
    const result = buildCharlesNextActionResponse({
      paciente,
      latestAnamnese: {
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        redFlags: ['Deficit neurologico'],
        yellowFlags: [],
        areasAfetadas: [{ regiao: 'LOMBAR' }],
      },
    });

    expect(result.blocked).toBe(true);
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'RED_FLAG_CRITICA' }),
      ]),
    );
    expect(result.nextAction.stage).toBe('MONITORAMENTO');
    expect(
      result.stages.find((stage) => stage.stage === 'EXAME_FISICO')?.status,
    ).toBe('BLOCKED');
  });

  it('emits yellow-flag alert when there are two or more yellow flags', () => {
    const result = buildCharlesNextActionResponse({
      paciente,
      latestAnamnese: {
        redFlags: [],
        yellowFlags: ['medo de movimento', 'catastrofizacao'],
        areasAfetadas: [{ regiao: 'LOMBAR' }],
      },
    });

    expect(result.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'YELLOW_FLAGS_RELEVANTES' }),
      ]),
    );
  });

  it('goes to monitoring when full clinical cycle is complete', () => {
    const laudoDate = new Date('2026-02-01T00:00:00.000Z');
    const evolucaoDate = new Date('2026-01-15T00:00:00.000Z');
    const result = buildCharlesNextActionResponse({
      paciente,
      latestAnamnese: {
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        redFlags: [],
        yellowFlags: [],
        areasAfetadas: [{ regiao: 'JOELHO' }],
      },
      latestEvolucao: {
        data: evolucaoDate,
      },
      latestLaudo: {
        updatedAt: laudoDate,
        exameFisico: '__EXAME_FISICO_STRUCTURED_V1__{}',
        status: LaudoStatus.VALIDADO_PROFISSIONAL,
        criteriosAlta: 'Alta funcional com autonomia.',
      },
    });

    expect(result.blocked).toBe(false);
    expect(result.nextAction.stage).toBe('MONITORAMENTO');
    expect(result.timeline.evolucaoEm).toBe(evolucaoDate);
    expect(result.timeline.laudoEm).toBe(laudoDate);
    expect(result.stages.every((stage) => stage.status === 'COMPLETED')).toBe(
      true,
    );
  });
});
