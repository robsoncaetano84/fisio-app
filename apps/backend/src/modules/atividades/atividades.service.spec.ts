import { NotFoundException } from '@nestjs/common';
import { AtividadesService } from './atividades.service';
import { ExerciseImageType } from './exercise-image-type.enum';

const makeRepository = () => ({
  create: jest.fn((input) => input),
  save: jest.fn(async (input) => ({ id: 'atividade-1', ...input })),
  find: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const makeService = () => {
  const atividadeRepository = makeRepository();
  const checkinRepository = makeRepository();
  const pacienteRepository = makeRepository();
  const anamneseRepository = makeRepository();
  const laudoRepository = makeRepository();
  const notificacoesService = {};
  const atividadeAiSuggestionService = {
    generate: jest.fn(),
  };
  const exerciciosCatalogService = {
    findApprovedById: jest.fn(),
    findBestMatchForSuggestion: jest.fn(),
  };

  const service = new AtividadesService(
    atividadeRepository as any,
    checkinRepository as any,
    pacienteRepository as any,
    anamneseRepository as any,
    laudoRepository as any,
    notificacoesService as any,
    atividadeAiSuggestionService as any,
    exerciciosCatalogService as any,
  );

  return {
    service,
    atividadeRepository,
    pacienteRepository,
    anamneseRepository,
    laudoRepository,
    atividadeAiSuggestionService,
    exerciciosCatalogService,
  };
};

describe('AtividadesService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a prescription from the proprietary exercise catalog metadata', async () => {
    const {
      service,
      atividadeRepository,
      pacienteRepository,
      exerciciosCatalogService,
    } = makeService();
    pacienteRepository.findOne.mockResolvedValue({
      id: 'paciente-1',
      usuarioId: 'profissional-1',
      ativo: true,
    });
    exerciciosCatalogService.findApprovedById.mockResolvedValue({
      id: 'exercicio-ponte',
      nome: 'Ponte curta',
      descricao: 'Ativacao de gluteos em decubito dorsal.',
      instrucoesPadrao: '1. Deite. 2. Eleve o quadril com controle.',
      imagemKey: ExerciseImageType.PONTE_CURTA,
    });

    const result = await service.create(
      {
        pacienteId: 'paciente-1',
        exercicioId: 'exercicio-ponte',
        titulo: '',
      },
      'profissional-1',
    );

    expect(result).toMatchObject({
      id: 'atividade-1',
      pacienteId: 'paciente-1',
      usuarioId: 'profissional-1',
      exercicioId: 'exercicio-ponte',
      titulo: 'Ponte curta',
      descricao: 'Ativacao de gluteos em decubito dorsal.',
      instrucoesExecucao: '1. Deite. 2. Eleve o quadril com controle.',
      imagemUrl: null,
      imagemTipo: ExerciseImageType.PONTE_CURTA,
      ativo: true,
    });
    expect(atividadeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        imagemUrl: null,
        imagemTipo: ExerciseImageType.PONTE_CURTA,
      }),
    );
  });

  it('returns the matched catalog exercise and specific image key in AI suggestions', async () => {
    const {
      service,
      pacienteRepository,
      anamneseRepository,
      laudoRepository,
      atividadeAiSuggestionService,
      exerciciosCatalogService,
    } = makeService();
    pacienteRepository.findOne.mockResolvedValue({
      id: 'paciente-1',
      usuarioId: 'profissional-1',
      ativo: true,
    });
    anamneseRepository.findOne.mockResolvedValue(null);
    laudoRepository.findOne.mockResolvedValue(null);
    atividadeAiSuggestionService.generate.mockResolvedValue({
      titulo: 'Ponte curta',
      descricao: 'Ativar gluteos e cadeia posterior.',
      instrucoesExecucao: '1. Eleve o quadril devagar.',
      imagemTipo: ExerciseImageType.MOBILIDADE_LOMBAR,
      referencias: [],
      source: 'rules',
    });
    exerciciosCatalogService.findBestMatchForSuggestion.mockResolvedValue({
      id: 'exercicio-ponte',
      nome: 'Ponte curta',
      imagemKey: ExerciseImageType.PONTE_CURTA,
    });

    const result = await service.generateAiSuggestion(
      { pacienteId: 'paciente-1' },
      'profissional-1',
    );

    expect(result).toMatchObject({
      titulo: 'Ponte curta',
      exercicioId: 'exercicio-ponte',
      exercicioNome: 'Ponte curta',
      imagemTipo: ExerciseImageType.PONTE_CURTA,
      source: 'rules',
    });
    expect(
      exerciciosCatalogService.findBestMatchForSuggestion,
    ).toHaveBeenCalledWith({
      titulo: 'Ponte curta',
      descricao: 'Ativar gluteos e cadeia posterior.',
      instrucoesExecucao: '1. Eleve o quadril devagar.',
      imagemTipo: ExerciseImageType.MOBILIDADE_LOMBAR,
    });
  });

  it('rejects AI suggestions when the patient does not belong to the professional', async () => {
    const { service, pacienteRepository, atividadeAiSuggestionService } =
      makeService();
    pacienteRepository.findOne.mockResolvedValue(null);

    await expect(
      service.generateAiSuggestion(
        { pacienteId: 'paciente-1' },
        'profissional-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(atividadeAiSuggestionService.generate).not.toHaveBeenCalled();
  });
});
