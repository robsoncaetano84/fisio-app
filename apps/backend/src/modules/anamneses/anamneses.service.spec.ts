import { ForbiddenException } from '@nestjs/common';
import { AnamnesesService } from './anamneses.service';
import { InicioProblema, MotivoBusca } from './entities/anamnese.entity';

describe('AnamnesesService', () => {
  const makeService = (paciente: {
    id: string;
    usuarioId: string;
    anamneseLiberadaPaciente?: boolean | null;
  }) => {
    const anamneseRepository = {
      create: jest.fn((input) => ({
        id: 'anamnese-1',
        createdAt: new Date('2026-06-07T10:00:00.000Z'),
        updatedAt: new Date('2026-06-07T10:00:00.000Z'),
        ...input,
      })),
      save: jest.fn(async (input) => input),
      findOne: jest.fn(),
      find: jest.fn(),
    };
    const anamneseHistoricoRepository = {
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => input),
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn(),
    };
    const pacientesService = {
      findOrCreateSelfPacienteForUsuario: jest.fn().mockResolvedValue(paciente),
      findOne: jest.fn(),
    };

    const service = new AnamnesesService(
      anamneseRepository as any,
      anamneseHistoricoRepository as any,
      pacientesService as any,
    );

    return {
      service,
      anamneseRepository,
      anamneseHistoricoRepository,
      pacientesService,
    };
  };

  const payload = {
    motivoBusca: MotivoBusca.PREVENTIVO,
    areasAfetadas: [],
    intensidadeDor: 0,
    inicioProblema: InicioProblema.NAO_SABE,
  };

  it('blocks patient self anamnesis when linked professional has not released it', async () => {
    const { service, anamneseRepository } = makeService({
      id: 'paciente-1',
      usuarioId: 'profissional-1',
      anamneseLiberadaPaciente: false,
    });

    await expect(
      service.createForPacienteUsuario(payload, 'paciente-user-1'),
    ).rejects.toThrow(ForbiddenException);
    expect(anamneseRepository.save).not.toHaveBeenCalled();
  });

  it('allows patient self anamnesis when professional released it', async () => {
    const { service, anamneseRepository } = makeService({
      id: 'paciente-1',
      usuarioId: 'profissional-1',
      anamneseLiberadaPaciente: true,
    });

    const result = await service.createForPacienteUsuario(
      payload,
      'paciente-user-1',
    );

    expect(result).toMatchObject({
      pacienteId: 'paciente-1',
      motivoBusca: MotivoBusca.PREVENTIVO,
    });
    expect(anamneseRepository.save).toHaveBeenCalledTimes(1);
  });

  it('allows autonomous patient anamnesis without professional release', async () => {
    const { service, anamneseRepository } = makeService({
      id: 'paciente-1',
      usuarioId: 'paciente-user-1',
      anamneseLiberadaPaciente: false,
    });

    await service.createForPacienteUsuario(payload, 'paciente-user-1');

    expect(anamneseRepository.save).toHaveBeenCalledTimes(1);
  });
});
