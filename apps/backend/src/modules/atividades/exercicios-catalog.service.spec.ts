import { BadRequestException } from '@nestjs/common';
import { ExerciseImageType } from './exercise-image-type.enum';
import { ExercicioStatus } from './entities/exercicio.entity';
import { INITIAL_EXERCISE_CATALOG } from './exercicio-catalog.seed';
import { ExerciciosCatalogService } from './exercicios-catalog.service';
import { ExercicioMidiaRevisaoClinicaStatus } from './entities/exercicio-midia.entity';

describe('ExerciciosCatalogService', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAutoSeed = process.env.EXERCISE_CATALOG_AUTO_SEED;

  const makeQueryBuilder = () => {
    const qb = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      addOrderBy: jest.fn(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    };
    Object.values(qb).forEach((fn) => {
      if (typeof fn === 'function' && fn.getMockName() === 'jest.fn()') {
        fn.mockReturnValue(qb);
      }
    });
    return qb;
  };

  const makeRepository = () => ({
    count: jest.fn(),
    create: jest.fn((input) => input),
    save: jest.fn(async (input) => input),
    update: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  });

  const makeService = () => {
    const exercicioRepository = makeRepository();
    const midiaRepository = makeRepository();
    const service = new ExerciciosCatalogService(
      exercicioRepository as any,
      midiaRepository as any,
    );

    return { service, exercicioRepository, midiaRepository };
  };

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalAutoSeed === undefined) {
      delete process.env.EXERCISE_CATALOG_AUTO_SEED;
    } else {
      process.env.EXERCISE_CATALOG_AUTO_SEED = originalAutoSeed;
    }
    jest.clearAllMocks();
  });

  it('seeds the proprietary exercise catalog in development when empty', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.EXERCISE_CATALOG_AUTO_SEED;
    const { service, exercicioRepository, midiaRepository } = makeService();
    exercicioRepository.count.mockResolvedValue(0);
    exercicioRepository.save.mockImplementation(async (input) => ({
      id: `exercicio-${exercicioRepository.save.mock.calls.length + 1}`,
      ...input,
    }));

    await service.onModuleInit();

    expect(exercicioRepository.save).toHaveBeenCalledTimes(
      INITIAL_EXERCISE_CATALOG.length,
    );
    expect(midiaRepository.save).toHaveBeenCalledTimes(
      INITIAL_EXERCISE_CATALOG.length,
    );
    expect(exercicioRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'mobilidade-lombar-gato-camelo',
        imagemKey: ExerciseImageType.MOBILIDADE_LOMBAR_GATO_CAMELO,
        status: ExercicioStatus.APROVADO,
        ativo: true,
        versao: 1,
      }),
    );
    expect(midiaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assetKey: 'MOBILIDADE_LOMBAR_GATO_CAMELO',
        sourceType: 'PROPRIA',
        license: 'PROPRIETARIA_SYNAP',
        attributionText: 'Ilustracao propria Synap.',
        revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.PENDENTE,
      }),
    );
  });

  it('does not auto seed outside development', async () => {
    process.env.NODE_ENV = 'production';
    const { service, exercicioRepository } = makeService();

    await service.onModuleInit();

    expect(exercicioRepository.count).not.toHaveBeenCalled();
  });

  it('filters approved active exercises and active media', async () => {
    const { service, exercicioRepository } = makeService();
    const qb = makeQueryBuilder();
    qb.getMany.mockResolvedValue([{ id: 'exercicio-1' }]);
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findAll({
      q: ' lombar ',
      regiaoCorporal: 'lombar',
      categoria: 'mobilidade',
      nivel: 'iniciante',
      tag: 'dor_lombar',
    });

    expect(result).toEqual([{ id: 'exercicio-1' }]);
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
      'exercicio.midias',
      'midia',
      'midia.ativo = :midiaAtiva',
      { midiaAtiva: true },
    );
    expect(qb.where).toHaveBeenCalledWith('exercicio.ativo = :ativo', {
      ativo: true,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('exercicio.status = :status', {
      status: ExercicioStatus.APROVADO,
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'exercicio.regiaoCorporal = :regiaoCorporal',
      { regiaoCorporal: 'LOMBAR' },
    );
    expect(qb.andWhere).toHaveBeenCalledWith('exercicio.tags @> :tag::jsonb', {
      tag: JSON.stringify(['dor_lombar']),
    });
  });

  it('lists drafts and archived exercises for admin catalog maintenance', async () => {
    const { service, exercicioRepository } = makeService();
    const qb = makeQueryBuilder();
    qb.getMany.mockResolvedValue([
      { id: 'exercicio-rascunho', status: ExercicioStatus.RASCUNHO },
      { id: 'exercicio-arquivado', status: ExercicioStatus.ARQUIVADO },
    ]);
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findAll({ includeDrafts: true });

    expect(result).toEqual([
      { id: 'exercicio-rascunho', status: ExercicioStatus.RASCUNHO },
      { id: 'exercicio-arquivado', status: ExercicioStatus.ARQUIVADO },
    ]);
    expect(qb.where).toHaveBeenCalledWith('1 = 1');
    expect(qb.andWhere).not.toHaveBeenCalledWith('exercicio.status = :status', {
      status: ExercicioStatus.APROVADO,
    });
  });

  it('finds approved exercise by id for prescriptions', async () => {
    const { service, exercicioRepository } = makeService();
    exercicioRepository.findOne.mockResolvedValue({ id: 'exercicio-1' });

    await expect(service.findApprovedById('exercicio-1')).resolves.toEqual({
      id: 'exercicio-1',
    });
    expect(exercicioRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 'exercicio-1',
        ativo: true,
        status: ExercicioStatus.APROVADO,
      },
    });
  });

  it('matches an AI suggestion to the best proprietary catalog exercise', async () => {
    const { service, exercicioRepository } = makeService();
    exercicioRepository.find.mockResolvedValue(
      INITIAL_EXERCISE_CATALOG.map((item, index) => ({
        id: `exercicio-${index + 1}`,
        ativo: true,
        ...item,
      })),
    );

    const result = await service.findBestMatchForSuggestion({
      titulo: 'Ponte curta para controle lombar',
      descricao:
        'Ativar gluteos e cadeia posterior com baixa carga em decubito dorsal.',
      instrucoesExecucao:
        'Eleve o quadril devagar e mantenha joelhos alinhados.',
      imagemTipo: 'MOBILIDADE_LOMBAR',
    });

    expect(result).toMatchObject({
      slug: 'ponte-curta',
      imagemKey: 'PONTE_CURTA',
    });
    expect(exercicioRepository.find).toHaveBeenCalledWith({
      where: { ativo: true, status: ExercicioStatus.APROVADO },
      order: { regiaoCorporal: 'ASC', nome: 'ASC' },
    });
  });

  it('creates an admin exercise with proprietary media metadata', async () => {
    const { service, exercicioRepository, midiaRepository } = makeService();
    const qb = makeQueryBuilder();
    exercicioRepository.findOne.mockResolvedValue(null);
    exercicioRepository.save.mockImplementation(async (input) => ({
      id: 'exercicio-1',
      ...input,
    }));
    midiaRepository.findOne.mockResolvedValue(null);
    qb.getOne.mockResolvedValue({ id: 'exercicio-1', nome: 'Exercicio novo' });
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await service.create(
      {
        nome: 'Exercicio novo',
        regiaoCorporal: ' lombar ',
        categoria: ' mobilidade ',
        nivel: ' iniciante ',
        objetivo: 'Melhorar mobilidade lombar.',
        instrucoesPadrao: '1. Execute com controle.',
        imagemKey: ExerciseImageType.MOBILIDADE_LOMBAR,
        tags: ['Lombar', 'Mobilidade lombar'],
        status: ExercicioStatus.APROVADO,
      },
      'admin-1',
    );

    expect(result).toEqual({ id: 'exercicio-1', nome: 'Exercicio novo' });
    expect(exercicioRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'exercicio-novo',
        regiaoCorporal: 'LOMBAR',
        categoria: 'MOBILIDADE',
        nivel: 'INICIANTE',
        imagemKey: 'MOBILIDADE_LOMBAR',
        tags: ['lombar', 'mobilidade_lombar'],
        revisadoPorUsuarioId: 'admin-1',
      }),
    );
    expect(midiaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        exercicioId: 'exercicio-1',
        assetKey: 'MOBILIDADE_LOMBAR',
        sourceType: 'PROPRIA',
        license: 'PROPRIETARIA_SYNAP',
        revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.PENDENTE,
      }),
    );
  });

  it('marks the primary media clinical review status for admin', async () => {
    const { service, exercicioRepository, midiaRepository } = makeService();
    const qb = makeQueryBuilder();
    const midia = {
      id: 'midia-1',
      exercicioId: 'exercicio-1',
      assetKey: 'PONTE_CURTA',
      ativo: true,
      revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.PENDENTE,
      versao: 1,
    };
    exercicioRepository.findOne.mockResolvedValue({
      id: 'exercicio-1',
      imagemKey: 'PONTE_CURTA',
    });
    midiaRepository.findOne.mockResolvedValue(midia);
    qb.getOne.mockResolvedValue({
      id: 'exercicio-1',
      midias: [
        {
          id: 'midia-1',
          revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.APROVADA,
        },
      ],
    });
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

    await expect(
      service.reviewPrimaryMedia(
        'exercicio-1',
        {
          status: ExercicioMidiaRevisaoClinicaStatus.APROVADA,
          observacao: 'Imagem clara para uso.',
        },
        'admin-1',
      ),
    ).resolves.toEqual({
      id: 'exercicio-1',
      midias: [
        {
          id: 'midia-1',
          revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.APROVADA,
        },
      ],
    });

    expect(midiaRepository.findOne).toHaveBeenCalledWith({
      where: {
        exercicioId: 'exercicio-1',
        assetKey: 'PONTE_CURTA',
        ativo: true,
      },
    });
    expect(midiaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.APROVADA,
        revisaoClinicaObservacao: 'Imagem clara para uso.',
        revisaoClinicaPorUsuarioId: 'admin-1',
        versao: 2,
      }),
    );
  });

  it('rejects creation when required catalog fields are blank after trim', async () => {
    const { service, exercicioRepository, midiaRepository } = makeService();

    await expect(
      service.create(
        {
          nome: '   ',
          regiaoCorporal: 'LOMBAR',
          categoria: 'MOBILIDADE',
          nivel: 'INICIANTE',
          objetivo: 'Melhorar mobilidade lombar.',
          instrucoesPadrao: '1. Execute com controle.',
          imagemKey: ExerciseImageType.MOBILIDADE_LOMBAR,
        },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(exercicioRepository.save).not.toHaveBeenCalled();
    expect(midiaRepository.save).not.toHaveBeenCalled();
  });

  it('rejects updates that would blank required catalog fields', async () => {
    const { service, exercicioRepository, midiaRepository } = makeService();
    exercicioRepository.findOne.mockResolvedValue({
      id: 'exercicio-1',
      nome: 'Ponte curta',
      regiaoCorporal: 'LOMBAR',
      categoria: 'FORTALECIMENTO',
      nivel: 'INICIANTE',
      objetivo: 'Ativar gluteos.',
      instrucoesPadrao: '1. Execute com controle.',
      status: ExercicioStatus.APROVADO,
      ativo: true,
      versao: 1,
    });

    await expect(
      service.update('exercicio-1', { objetivo: '   ' }, 'admin-1'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(exercicioRepository.save).not.toHaveBeenCalled();
    expect(midiaRepository.save).not.toHaveBeenCalled();
  });

  it('archives exercise and disables its media', async () => {
    const { service, exercicioRepository, midiaRepository } = makeService();
    const exercicio = {
      id: 'exercicio-1',
      ativo: true,
      status: ExercicioStatus.APROVADO,
      versao: 1,
    };
    exercicioRepository.findOne.mockResolvedValue(exercicio);

    await expect(service.archive('exercicio-1', 'admin-1')).resolves.toEqual({
      success: true,
    });

    expect(exercicioRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ativo: false,
        status: ExercicioStatus.ARQUIVADO,
        versao: 2,
        revisadoPorUsuarioId: 'admin-1',
      }),
    );
    expect(midiaRepository.update).toHaveBeenCalledWith(
      { exercicioId: 'exercicio-1' },
      { ativo: false },
    );
  });

  it('restores archived exercise when admin changes status', async () => {
    const { service, exercicioRepository, midiaRepository } = makeService();
    const qb = makeQueryBuilder();
    const exercicio = {
      id: 'exercicio-1',
      ativo: false,
      status: ExercicioStatus.ARQUIVADO,
      versao: 2,
      imagemKey: 'MOBILIDADE_LOMBAR',
    };
    const midia = {
      id: 'midia-1',
      exercicioId: 'exercicio-1',
      assetKey: 'MOBILIDADE_LOMBAR',
      ativo: false,
      versao: 1,
    };
    exercicioRepository.findOne.mockResolvedValueOnce(exercicio);
    midiaRepository.findOne.mockResolvedValue(midia);
    qb.getOne.mockResolvedValue({
      id: 'exercicio-1',
      ativo: true,
      status: ExercicioStatus.APROVADO,
    });
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

    await expect(
      service.update(
        'exercicio-1',
        { status: ExercicioStatus.APROVADO },
        'admin-1',
      ),
    ).resolves.toEqual({
      id: 'exercicio-1',
      ativo: true,
      status: ExercicioStatus.APROVADO,
    });

    expect(exercicioRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'exercicio-1' },
    });
    expect(exercicioRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ativo: true,
        status: ExercicioStatus.APROVADO,
        versao: 3,
        revisadoPorUsuarioId: 'admin-1',
      }),
    );
    expect(midiaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        exercicioId: 'exercicio-1',
        assetKey: 'MOBILIDADE_LOMBAR',
        sourceType: 'PROPRIA',
        license: 'PROPRIETARIA_SYNAP',
        ativo: true,
        versao: 2,
      }),
    );
    expect(midiaRepository.create).not.toHaveBeenCalled();
  });
});
