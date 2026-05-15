import { BadRequestException } from '@nestjs/common';
import { LaudoStatus } from './entities/laudo.entity';
import {
  LaudoExameHistoricoAcao,
  LaudoExameHistoricoOrigem,
} from './entities/laudo-exame-historico.entity';
import { LaudoExameFisicoService } from './laudo-exame-fisico.service';

describe('LaudoExameFisicoService', () => {
  const makeRepository = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((input) => input),
    save: jest.fn(async (input) => input),
  });

  const makeService = () => {
    const laudoRepository = makeRepository();
    const exameRepository = makeRepository();
    const historicoRepository = makeRepository();
    const service = new LaudoExameFisicoService(
      laudoRepository as any,
      exameRepository as any,
      historicoRepository as any,
    );

    return {
      service,
      laudoRepository,
      exameRepository,
      historicoRepository,
    };
  };

  it('hydrates laudo with latest physical exam', async () => {
    const { service, exameRepository } = makeService();
    exameRepository.findOne.mockResolvedValue({
      exameFisico: 'Exame fisico registrado.',
    });
    const laudo = { pacienteId: 'paciente-1', exameFisico: null } as any;

    await expect(service.hydrateLaudo(laudo)).resolves.toBe(laudo);

    expect(laudo.exameFisico).toBe('Exame fisico registrado.');
  });

  it('normalizes history limit before querying', async () => {
    const { service, historicoRepository } = makeService();
    historicoRepository.find.mockResolvedValue([]);

    await service.findHistoryByLaudoId('laudo-1', 999);

    expect(historicoRepository.find).toHaveBeenCalledWith({
      where: { laudoId: 'laudo-1' },
      order: { revisao: 'DESC' },
      take: 100,
    });
  });

  it('rejects empty initial physical exam', async () => {
    const { service } = makeService();

    await expect(
      service.registerInitial(
        { id: 'laudo-1' } as any,
        {
          pacienteId: 'paciente-1',
          exameFisico: '   ',
        } as any,
        'user-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('registers initial exam and creates history revision', async () => {
    const { service, laudoRepository, exameRepository, historicoRepository } =
      makeService();
    exameRepository.findOne.mockResolvedValue(null);
    historicoRepository.findOne.mockResolvedValue({ id: 'hist-1', revisao: 2 });
    const createdExam = { id: 'exame-1' };
    exameRepository.create.mockReturnValue(createdExam);
    exameRepository.save.mockResolvedValue(createdExam);
    const createdHistory = { id: 'hist-2' };
    historicoRepository.create.mockReturnValue(createdHistory);

    const laudo = {
      id: 'laudo-1',
      pacienteId: 'paciente-1',
      status: LaudoStatus.RASCUNHO_IA,
      exameFisico: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    } as any;

    await expect(
      service.registerInitial(
        laudo,
        {
          pacienteId: 'paciente-1',
          exameFisico: 'Mobilidade reduzida.',
          diagnosticoFuncional: 'Disfuncao lombar.',
          condutas: 'Exercicios.',
        } as any,
        'user-1',
      ),
    ).resolves.toBe(createdExam);

    expect(exameRepository.create).toHaveBeenCalledWith({
      pacienteId: 'paciente-1',
      laudoId: 'laudo-1',
      exameFisico: 'Mobilidade reduzida.',
      diagnosticoFuncional: 'Disfuncao lombar.',
      condutas: 'Exercicios.',
      registradoPorUsuarioId: 'user-1',
    });
    expect(laudo.exameFisico).toBe('Mobilidade reduzida.');
    expect(laudoRepository.save).toHaveBeenCalledWith(laudo);
    expect(historicoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        laudoId: 'laudo-1',
        pacienteId: 'paciente-1',
        revisao: 3,
        acao: LaudoExameHistoricoAcao.CREATE,
        origem: LaudoExameHistoricoOrigem.PROFISSIONAL,
        alteradoPorUsuarioId: 'user-1',
      }),
    );
    expect(historicoRepository.save).toHaveBeenCalledWith(createdHistory);
  });
});
