import { ExercicioStatus } from './entities/exercicio.entity';
import { INITIAL_EXERCISE_CATALOG } from './exercicio-catalog.seed';
import { ExerciciosCatalogService } from './exercicios-catalog.service';

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
        imagemKey: 'MOBILIDADE_LOMBAR',
        status: ExercicioStatus.APROVADO,
        ativo: true,
        versao: 1,
      }),
    );
    expect(midiaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assetKey: 'MOBILIDADE_LOMBAR',
        sourceType: 'PROPRIA',
        license: 'PROPRIETARIA_SYNAP',
        attributionText: 'Ilustracao propria Synap.',
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
});
