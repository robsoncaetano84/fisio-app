import { BadRequestException } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { ExerciseImageType } from './exercise-image-type.enum';
import { ExercicioStatus } from './entities/exercicio.entity';
import { PREVIEW_EXERCISE_CATALOG } from './exercise-catalog-preview.seed';
import { INITIAL_EXERCISE_CATALOG } from './exercicio-catalog.seed';
import { MASTER_EXERCISE_CATALOG } from './exercise-catalog-master.seed';
import { ExerciciosCatalogService } from './exercicios-catalog.service';
import { ExercicioMidiaRevisaoClinicaStatus } from './entities/exercicio-midia.entity';

describe('ExerciciosCatalogService', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAutoSeed = process.env.EXERCISE_CATALOG_AUTO_SEED;

  const makeQueryBuilder = () => {
    const qb = {
      innerJoinAndSelect: jest.fn(),
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

    // O seed combina INITIAL + PREVIEW + MASTER deduplicando por slug, e so
    // cria midia principal para itens que ja possuem imagemKey.
    const seenSlugs = new Set<string>();
    const catalogoEsperado = [
      ...INITIAL_EXERCISE_CATALOG,
      ...PREVIEW_EXERCISE_CATALOG,
      ...MASTER_EXERCISE_CATALOG,
    ].filter((item) => {
      if (seenSlugs.has(item.slug)) return false;
      seenSlugs.add(item.slug);
      return true;
    });
    const expectedExercicios = catalogoEsperado.length;
    const expectedMidias = catalogoEsperado.filter(
      (item) => item.imagemKey,
    ).length;
    expect(exercicioRepository.save).toHaveBeenCalledTimes(expectedExercicios);
    expect(midiaRepository.save).toHaveBeenCalledTimes(expectedMidias);
    expect(exercicioRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Mobilidade lombar em gato-camelo',
        slug: 'mobilidade-lombar-gato-camelo',
        objetivo: 'Reduzir rigidez lombar e melhorar controle lombo-pélvico.',
        imagemKey: ExerciseImageType.MOBILIDADE_LOMBAR_GATO_CAMELO,
        status: ExercicioStatus.APROVADO,
        translations: expect.objectContaining({
          pt: expect.objectContaining({
            objetivo:
              'Reduzir rigidez lombar e melhorar controle lombo-pélvico.',
          }),
          en: expect.objectContaining({ nome: expect.any(String) }),
          es: expect.objectContaining({ nome: expect.any(String) }),
        }),
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
    expect(exercicioRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'prancha-frontal-antebraco',
        imagemKey: ExerciseImageType.PRANCHA_FRONTAL_ANTEBRACO,
        status: ExercicioStatus.RASCUNHO,
        ativo: true,
        versao: 1,
      }),
    );
  });

  it('does not auto seed outside development', async () => {
    process.env.NODE_ENV = 'production';
    const { service, exercicioRepository } = makeService();

    await service.onModuleInit();

    expect(exercicioRepository.count).not.toHaveBeenCalled();
  });

  it('filters approved active exercises with clinically approved primary media', async () => {
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
    expect(qb.innerJoinAndSelect).toHaveBeenCalledWith(
      'exercicio.midias',
      'midia',
      [
        'midia.ativo = :midiaAtiva',
        'midia.assetKey = exercicio.imagemKey',
        'midia.revisaoClinicaStatus = :revisaoClinicaStatus',
      ].join(' AND '),
      {
        midiaAtiva: true,
        revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.APROVADA,
      },
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
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
      'exercicio.midias',
      'midia',
      'midia.ativo = :midiaAtiva',
      { midiaAtiva: true },
    );
    expect(qb.innerJoinAndSelect).not.toHaveBeenCalled();
    expect(qb.where).toHaveBeenCalledWith('1 = 1');
    expect(qb.andWhere).not.toHaveBeenCalledWith('exercicio.status = :status', {
      status: ExercicioStatus.APROVADO,
    });
  });

  it('lists the image production queue with priorities and status summary', async () => {
    const { service, exercicioRepository } = makeService();
    const qb = makeQueryBuilder();
    qb.getMany.mockResolvedValue([
      {
        id: 'exercicio-pendente',
        nome: 'Ponte curta',
        slug: 'ponte-curta',
        regiaoCorporal: 'LOMBAR',
        categoria: 'FORTALECIMENTO',
        nivel: 'INICIANTE',
        status: ExercicioStatus.RASCUNHO,
        imagemKey: 'PONTE_CURTA',
        tags: ['lombar'],
        midias: [
          {
            ativo: true,
            assetKey: 'PONTE_CURTA',
            revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.PENDENTE,
          },
        ],
      },
      {
        id: 'exercicio-sem-imagem',
        nome: 'Agachamento assistido',
        slug: 'agachamento-assistido',
        regiaoCorporal: 'JOELHO',
        categoria: 'FORTALECIMENTO',
        nivel: 'INICIANTE',
        status: ExercicioStatus.RASCUNHO,
        imagemKey: null,
        tags: ['joelho'],
        midias: [],
      },
      {
        id: 'exercicio-aprovado',
        nome: 'Gato camelo',
        slug: 'gato-camelo',
        regiaoCorporal: 'LOMBAR',
        categoria: 'MOBILIDADE',
        nivel: 'INICIANTE',
        status: ExercicioStatus.RASCUNHO,
        imagemKey: 'MOBILIDADE_LOMBAR_GATO_CAMELO',
        tags: ['lombar'],
        midias: [
          {
            ativo: true,
            assetKey: 'MOBILIDADE_LOMBAR_GATO_CAMELO',
            revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.APROVADA,
          },
        ],
      },
      {
        id: 'exercicio-regenerar',
        nome: 'Bird dog',
        slug: 'bird-dog',
        regiaoCorporal: 'LOMBAR',
        categoria: 'CONTROLE_MOTOR',
        nivel: 'INTERMEDIARIO',
        status: ExercicioStatus.RASCUNHO,
        imagemKey: 'BIRD_DOG',
        tags: ['core'],
        midias: [
          {
            ativo: true,
            assetKey: 'BIRD_DOG',
            revisaoClinicaStatus:
              ExercicioMidiaRevisaoClinicaStatus.REGENERAR_IMAGEM,
          },
        ],
      },
    ]);
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findImageProductionQueue({ limit: '2' });

    expect(result.total).toBe(3);
    expect(result.limit).toBe(2);
    expect(result.appliedFilters).toMatchObject({
      q: null,
      filaStatus: null,
      limit: 2,
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      id: 'exercicio-sem-imagem',
      filaStatus: 'SEM_IMAGEM',
      prioridade: 100,
      mediaReviewStatus: null,
    });
    expect(result.items[1]).toMatchObject({
      id: 'exercicio-regenerar',
      filaStatus: 'REGENERAR_IMAGEM',
      prioridade: 90,
      mediaReviewStatus: ExercicioMidiaRevisaoClinicaStatus.REGENERAR_IMAGEM,
    });
    expect(result.resumo).toMatchObject({
      SEM_IMAGEM: 1,
      REGENERAR_IMAGEM: 1,
      IMAGEM_PENDENTE_REVISAO: 1,
    });
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
      'exercicio.midias',
      'midia',
      'midia.ativo = :midiaAtiva AND midia.assetKey = exercicio.imagemKey',
      { midiaAtiva: true },
    );
    expect(qb.where).toHaveBeenCalledWith('exercicio.ativo = :ativo', {
      ativo: true,
    });
  });

  it('filters the image production queue by queue status', async () => {
    const { service, exercicioRepository } = makeService();
    const qb = makeQueryBuilder();
    qb.getMany.mockResolvedValue([
      {
        id: 'exercicio-sem-imagem',
        nome: 'Agachamento assistido',
        slug: 'agachamento-assistido',
        regiaoCorporal: 'JOELHO',
        categoria: 'FORTALECIMENTO',
        nivel: 'INICIANTE',
        status: ExercicioStatus.RASCUNHO,
        imagemKey: null,
        tags: [],
        midias: [],
      },
      {
        id: 'exercicio-pendente',
        nome: 'Ponte curta',
        slug: 'ponte-curta',
        regiaoCorporal: 'LOMBAR',
        categoria: 'FORTALECIMENTO',
        nivel: 'INICIANTE',
        status: ExercicioStatus.RASCUNHO,
        imagemKey: 'PONTE_CURTA',
        tags: [],
        midias: [
          {
            ativo: true,
            assetKey: 'PONTE_CURTA',
            revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.PENDENTE,
          },
        ],
      },
    ]);
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findImageProductionQueue({
      filaStatus: 'imagem_pendente_revisao',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      id: 'exercicio-pendente',
      filaStatus: 'IMAGEM_PENDENTE_REVISAO',
    });
  });

  it('applies broad text search fields to image production queue', async () => {
    const { service, exercicioRepository } = makeService();
    const qb = makeQueryBuilder();
    qb.getMany.mockResolvedValue([]);
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

    await service.findImageProductionBriefs({ q: 'joelho' });

    const bracketConditions = qb.andWhere.mock.calls
      .map(([condition]) => condition)
      .filter((condition) => condition instanceof Brackets);

    const searchInner = bracketConditions
      .map((condition) => {
        const inner = {
          where: jest.fn().mockReturnThis(),
          orWhere: jest.fn().mockReturnThis(),
        };
        condition.whereFactory(inner as any);
        return inner;
      })
      .find((inner) =>
        inner.where.mock.calls.some(
          ([condition]) => condition === 'exercicio.nome ILIKE :q',
        ),
      );
    expect(searchInner).toBeDefined();

    expect(searchInner?.where).toHaveBeenCalledWith('exercicio.nome ILIKE :q', {
      q: '%joelho%',
    });
    expect(searchInner?.orWhere).toHaveBeenCalledWith(
      'exercicio.regiaoCorporal ILIKE :q',
      { q: '%joelho%' },
    );
    expect(searchInner?.orWhere).toHaveBeenCalledWith(
      'exercicio.categoria ILIKE :q',
      { q: '%joelho%' },
    );
    expect(searchInner?.orWhere).toHaveBeenCalledWith(
      'exercicio.imagemKey ILIKE :q',
      { q: '%joelho%' },
    );
    expect(searchInner?.orWhere).toHaveBeenCalledWith(
      'CAST(exercicio.tags AS TEXT) ILIKE :q',
      { q: '%joelho%' },
    );
  });

  it('builds image production briefs in batch from the queue', async () => {
    const { service, exercicioRepository } = makeService();
    const qb = makeQueryBuilder();
    qb.getMany.mockResolvedValue([
      {
        id: 'exercicio-pendente',
        nome: 'Ponte curta',
        slug: 'ponte-curta',
        regiaoCorporal: 'LOMBAR',
        categoria: 'FORTALECIMENTO',
        nivel: 'INICIANTE',
        objetivo: 'Ativar gluteos.',
        descricao: null,
        instrucoesPadrao: 'Eleve o quadril com controle.',
        cuidados: null,
        contraindicacoes: null,
        status: ExercicioStatus.RASCUNHO,
        imagemKey: 'PONTE_CURTA',
        tags: ['lombar'],
        midias: [
          {
            ativo: true,
            assetKey: 'PONTE_CURTA',
            revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.PENDENTE,
          },
        ],
      },
      {
        id: 'exercicio-sem-imagem',
        nome: 'Agachamento assistido',
        slug: 'agachamento-assistido',
        regiaoCorporal: 'JOELHO',
        categoria: 'FORTALECIMENTO',
        nivel: 'INICIANTE',
        objetivo: 'Treinar controle de joelho.',
        descricao: null,
        instrucoesPadrao: 'Flexione joelhos e quadris com controle.',
        cuidados: null,
        contraindicacoes: null,
        status: ExercicioStatus.RASCUNHO,
        imagemKey: null,
        tags: ['joelho'],
        midias: [],
      },
      {
        id: 'exercicio-aprovado',
        nome: 'Gato camelo',
        slug: 'gato-camelo',
        regiaoCorporal: 'LOMBAR',
        categoria: 'MOBILIDADE',
        nivel: 'INICIANTE',
        objetivo: 'Mobilizar coluna.',
        descricao: null,
        instrucoesPadrao: 'Alterne flexao e extensao.',
        cuidados: null,
        contraindicacoes: null,
        status: ExercicioStatus.RASCUNHO,
        imagemKey: 'MOBILIDADE_LOMBAR_GATO_CAMELO',
        tags: ['lombar'],
        midias: [
          {
            ativo: true,
            assetKey: 'MOBILIDADE_LOMBAR_GATO_CAMELO',
            revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.APROVADA,
          },
        ],
      },
    ]);
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findImageProductionBriefs({
      q: ' joelho ',
      filaStatus: 'sem_imagem',
      limit: '1',
    });

    expect(result.total).toBe(1);
    expect(result.limit).toBe(1);
    expect(result.appliedFilters).toMatchObject({
      q: 'joelho',
      filaStatus: 'SEM_IMAGEM',
      limit: 1,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      imageKeySuggestion: 'AGACHAMENTO_ASSISTIDO',
      assetFileNameSuggestion: 'agachamento-assistido.jpg',
      assetPathSuggestion:
        'exercise-images/exercises/agachamento-assistido/full.jpg',
      tituloPaciente: 'Agachamento assistido',
      descricaoPaciente: 'Flexione joelhos e quadris com controle.',
      exercicio: {
        id: 'exercicio-sem-imagem',
        filaStatus: 'SEM_IMAGEM',
      },
    });
    expect(result.items[0].promptBase).toContain('Agachamento assistido');
    expect(result.items[0].productionMarkdown).toContain(
      '# Agachamento assistido',
    );
    expect(result.items[0].productionMarkdown).toContain(
      '## Checklist de revisão',
    );
    expect(result.items[0].productionMarkdown).toContain(
      '## Checklist técnico',
    );
    expect(result.productionMarkdownBatch).toContain(
      '# Pacote de produção de imagens',
    );
    expect(result.productionMarkdownBatch).toContain('- Busca: joelho');
    expect(result.productionMarkdownBatch).toContain(
      '- Status da fila: SEM_IMAGEM',
    );
    expect(result.productionMarkdownBatch).toContain(
      '## 1. Agachamento assistido',
    );
    expect(result.productionMarkdownBatch).toContain('# Agachamento assistido');
    expect(result.resumo).toMatchObject({
      SEM_IMAGEM: 1,
      IMAGEM_PENDENTE_REVISAO: 0,
    });
  });

  it('rejects invalid image production queue filters', async () => {
    const { service, exercicioRepository } = makeService();

    await expect(
      service.findImageProductionQueue({ filaStatus: 'SOLTO' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.findImageProductionQueue({ limit: '0' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.findImageProductionBriefs({ limit: '0' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(exercicioRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('builds an image production brief for a queued exercise', async () => {
    const { service, exercicioRepository } = makeService();
    const qb = makeQueryBuilder();
    qb.getOne.mockResolvedValue({
      id: 'exercicio-brief',
      nome: 'Agachamento assistido',
      slug: 'agachamento-assistido',
      regiaoCorporal: 'JOELHO',
      categoria: 'FORTALECIMENTO',
      nivel: 'INICIANTE',
      objetivo: 'Treinar controle de joelho e quadril.',
      descricao: 'Agachar parcialmente usando apoio anterior.',
      instrucoesPadrao: 'Flexione joelhos e quadris com controle.',
      cuidados: 'Evitar valgo dinamico.',
      contraindicacoes: null,
      status: ExercicioStatus.RASCUNHO,
      ativo: true,
      imagemKey: null,
      tags: ['joelho', 'agachamento'],
      midias: [],
    });
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await service.getImageProductionBrief('exercicio-brief');

    expect(result).toMatchObject({
      imageKeySuggestion: 'AGACHAMENTO_ASSISTIDO',
      assetFileNameSuggestion: 'agachamento-assistido.jpg',
      assetPathSuggestion:
        'exercise-images/exercises/agachamento-assistido/full.jpg',
      tituloPaciente: 'Agachamento assistido',
      descricaoPaciente: 'Flexione joelhos e quadris com controle.',
      exercicio: {
        id: 'exercicio-brief',
        filaStatus: 'SEM_IMAGEM',
        prioridade: 100,
      },
    });
    expect(result.promptBase).toContain('Agachamento assistido');
    expect(result.promptBase).toContain('Evitar valgo dinamico');
    expect(result.orientacaoProfissional).toContain('Treinar controle');
    expect(result.accessibilityLabel).toContain(
      'Ilustração do exercício Agachamento assistido',
    );
    expect(result.productionMarkdown).toContain('## Prompt negativo');
    expect(result.productionMarkdown).toContain(
      'Arquivo sugerido: agachamento-assistido.jpg',
    );
    expect(result.productionMarkdown).toContain(
      'Caminho do asset: exercise-images/exercises/agachamento-assistido/full.jpg',
    );
    expect(result.implementationChecklist).toContain(
      'Registrar a mídia via PATCH /exercicios/{id}/midia-principal-storage com storagePath, thumbnailUrl, imageUrl, mimeType, width, height e bytes.',
    );
    expect(result.negativePrompt).toContain('logos externos');
    expect(result.promptBase).toContain(
      'Adulto neutro, sem identidade facial forte',
    );
    expect(result.promptBase).toContain(
      'Roupa esportiva justa cinza-claro/off-white',
    );
    expect(result.promptBase).toContain(
      'Destaque verde Synap somente no músculo-alvo ou na direção do movimento',
    );
    expect(result.promptBase).toContain("sem marca d'água");
    expect(result.checklistRevisao).toContain(
      'Membros apoiados e membros em movimento estão corretos.',
    );
    expect(result.checklistRevisao).toContain(
      'Figura segue o padrão de adulto neutro, sem identidade facial forte e sem aparência de pessoa real identificável.',
    );
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
      'exercicio.midias',
      'midia',
      'midia.ativo = :midiaAtiva',
      { midiaAtiva: true },
    );
  });

  it('rejects image production brief for an exercise already approved with reviewed media', async () => {
    const { service, exercicioRepository } = makeService();
    const qb = makeQueryBuilder();
    qb.getOne.mockResolvedValue({
      id: 'exercicio-aprovado',
      nome: 'Ponte curta',
      slug: 'ponte-curta',
      regiaoCorporal: 'LOMBAR',
      categoria: 'FORTALECIMENTO',
      nivel: 'INICIANTE',
      objetivo: 'Ativar gluteos.',
      instrucoesPadrao: 'Eleve o quadril com controle.',
      status: ExercicioStatus.APROVADO,
      ativo: true,
      imagemKey: 'PONTE_CURTA',
      tags: ['lombar'],
      midias: [
        {
          ativo: true,
          assetKey: 'PONTE_CURTA',
          revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.APROVADA,
        },
      ],
    });
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

    await expect(
      service.getImageProductionBrief('exercicio-aprovado'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds approved exercise by id for prescriptions', async () => {
    const { service, exercicioRepository } = makeService();
    const qb = makeQueryBuilder();
    qb.getOne.mockResolvedValue({ id: 'exercicio-1' });
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

    await expect(service.findApprovedById('exercicio-1')).resolves.toEqual({
      id: 'exercicio-1',
    });
    expect(qb.innerJoinAndSelect).toHaveBeenCalledWith(
      'exercicio.midias',
      'midia',
      [
        'midia.ativo = :midiaAtiva',
        'midia.assetKey = exercicio.imagemKey',
        'midia.revisaoClinicaStatus = :revisaoClinicaStatus',
      ].join(' AND '),
      {
        midiaAtiva: true,
        revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.APROVADA,
      },
    );
    expect(qb.where).toHaveBeenCalledWith('exercicio.id = :id', {
      id: 'exercicio-1',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('exercicio.ativo = :ativo', {
      ativo: true,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('exercicio.status = :status', {
      status: ExercicioStatus.APROVADO,
    });
    expect(exercicioRepository.findOne).not.toHaveBeenCalled();
  });

  it('matches an AI suggestion to the best proprietary catalog exercise', async () => {
    const { service, exercicioRepository } = makeService();
    const qb = makeQueryBuilder();
    qb.getMany.mockResolvedValue(
      INITIAL_EXERCISE_CATALOG.map((item, index) => ({
        id: `exercicio-${index + 1}`,
        ativo: true,
        ...item,
      })),
    );
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

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
    expect(qb.innerJoinAndSelect).toHaveBeenCalledWith(
      'exercicio.midias',
      'midia',
      [
        'midia.ativo = :midiaAtiva',
        'midia.assetKey = exercicio.imagemKey',
        'midia.revisaoClinicaStatus = :revisaoClinicaStatus',
      ].join(' AND '),
      {
        midiaAtiva: true,
        revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.APROVADA,
      },
    );
    expect(qb.where).toHaveBeenCalledWith('exercicio.ativo = :ativo', {
      ativo: true,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('exercicio.status = :status', {
      status: ExercicioStatus.APROVADO,
    });
    expect(exercicioRepository.find).not.toHaveBeenCalled();
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
        status: ExercicioStatus.RASCUNHO,
      },
      'admin-1',
    );

    expect(result).toEqual({ id: 'exercicio-1', nome: 'Exercicio novo' });
    expect(exercicioRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Exercício novo',
        slug: 'exercicio-novo',
        regiaoCorporal: 'LOMBAR',
        categoria: 'MOBILIDADE',
        nivel: 'INICIANTE',
        objetivo: 'Melhorar mobilidade lombar.',
        imagemKey: 'MOBILIDADE_LOMBAR',
        tags: ['lombar', 'mobilidade_lombar'],
        translations: expect.objectContaining({
          pt: expect.objectContaining({
            nome: 'Exercício novo',
            objetivo: 'Melhorar mobilidade lombar.',
          }),
          en: expect.objectContaining({ nome: 'New exercise' }),
          es: expect.objectContaining({ nome: 'Ejercicio nuevo' }),
        }),
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

  it('rejects approved exercise creation without primary image', async () => {
    const { service, exercicioRepository, midiaRepository } = makeService();
    exercicioRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        {
          nome: 'Exercicio sem imagem',
          regiaoCorporal: 'LOMBAR',
          categoria: 'MOBILIDADE',
          nivel: 'INICIANTE',
          objetivo: 'Preparar revisao futura.',
          instrucoesPadrao: '1. Revisar antes de prescrever.',
          imagemKey: null,
          status: ExercicioStatus.APROVADO,
        },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(exercicioRepository.save).not.toHaveBeenCalled();
    expect(midiaRepository.save).not.toHaveBeenCalled();
  });

  it('rejects approved exercise creation before primary media approval', async () => {
    const { service, exercicioRepository, midiaRepository } = makeService();
    exercicioRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        {
          nome: 'Exercicio com imagem pendente',
          regiaoCorporal: 'LOMBAR',
          categoria: 'MOBILIDADE',
          nivel: 'INICIANTE',
          objetivo: 'Preparar revisao futura.',
          instrucoesPadrao: '1. Revisar antes de prescrever.',
          imagemKey: ExerciseImageType.MOBILIDADE_LOMBAR,
          status: ExercicioStatus.APROVADO,
        },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(exercicioRepository.save).not.toHaveBeenCalled();
    expect(midiaRepository.save).not.toHaveBeenCalled();
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

  it('registers remote storage metadata and sends changed media back to review', async () => {
    const { service, exercicioRepository, midiaRepository } = makeService();
    const qb = makeQueryBuilder();
    const midia = {
      id: 'midia-1',
      exercicioId: 'exercicio-1',
      assetKey: 'PONTE_CURTA',
      tipo: 'ILUSTRACAO',
      sourceType: 'PROPRIA',
      sourceUrl: null,
      storagePath: null,
      thumbnailUrl: null,
      imageUrl: null,
      mimeType: null,
      width: null,
      height: null,
      bytes: null,
      author: 'Synap',
      license: 'PROPRIETARIA_SYNAP',
      licenseUrl: null,
      attributionText: 'Ilustracao propria Synap.',
      ativo: true,
      revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.APROVADA,
      revisaoClinicaObservacao: 'Aprovada anteriormente.',
      revisaoClinicaPorUsuarioId: 'admin-old',
      revisaoClinicaEm: new Date('2026-01-01T00:00:00.000Z'),
      versao: 1,
    };
    exercicioRepository.findOne.mockResolvedValue({
      id: 'exercicio-1',
      imagemKey: 'PONTE_CURTA',
      ativo: true,
      status: ExercicioStatus.RASCUNHO,
    });
    midiaRepository.findOne.mockResolvedValue(midia);
    qb.getOne.mockResolvedValue({
      id: 'exercicio-1',
      midias: [midia],
    });
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

    await expect(
      service.updatePrimaryMediaStorage(
        'exercicio-1',
        {
          storagePath: 'exercises/ponte-curta/full.jpg',
          thumbnailUrl:
            'https://project.supabase.co/storage/v1/object/public/exercise-images/exercises/ponte-curta/thumb.jpg',
          imageUrl:
            'https://project.supabase.co/storage/v1/object/public/exercise-images/exercises/ponte-curta/full.jpg',
          mimeType: 'image/jpeg',
          width: 1024,
          height: 1024,
          bytes: 42000,
        },
        'admin-1',
      ),
    ).resolves.toEqual({
      id: 'exercicio-1',
      midias: [midia],
    });

    expect(midiaRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        storagePath: 'exercises/ponte-curta/full.jpg',
        thumbnailUrl:
          'https://project.supabase.co/storage/v1/object/public/exercise-images/exercises/ponte-curta/thumb.jpg',
        imageUrl:
          'https://project.supabase.co/storage/v1/object/public/exercise-images/exercises/ponte-curta/full.jpg',
        sourceType: 'SUPABASE_STORAGE',
        sourceUrl:
          'https://project.supabase.co/storage/v1/object/public/exercise-images/exercises/ponte-curta/full.jpg',
        mimeType: 'image/jpeg',
        width: 1024,
        height: 1024,
        bytes: 42000,
        revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.PENDENTE,
        revisaoClinicaObservacao: null,
        revisaoClinicaPorUsuarioId: null,
        revisaoClinicaEm: null,
        revisadoPorUsuarioId: 'admin-1',
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

  it('removes the primary image and disables media when admin clears imagemKey', async () => {
    const { service, exercicioRepository, midiaRepository } = makeService();
    const qb = makeQueryBuilder();
    exercicioRepository.findOne.mockResolvedValue({
      id: 'exercicio-1',
      nome: 'Ponte curta',
      regiaoCorporal: 'LOMBAR',
      categoria: 'FORTALECIMENTO',
      nivel: 'INICIANTE',
      objetivo: 'Ativar gluteos.',
      instrucoesPadrao: '1. Execute com controle.',
      imagemKey: 'PONTE_CURTA',
      status: ExercicioStatus.RASCUNHO,
      ativo: true,
      versao: 1,
    });
    exercicioRepository.save.mockImplementation(async (input) => ({
      ...input,
      id: 'exercicio-1',
    }));
    qb.getOne.mockResolvedValue({
      id: 'exercicio-1',
      imagemKey: null,
      midias: [],
    });
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

    await expect(
      service.update('exercicio-1', { imagemKey: null }, 'admin-1'),
    ).resolves.toEqual({
      id: 'exercicio-1',
      imagemKey: null,
      midias: [],
    });

    expect(exercicioRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        imagemKey: null,
        versao: 2,
        revisadoPorUsuarioId: 'admin-1',
      }),
    );
    expect(midiaRepository.update).toHaveBeenCalledWith(
      { exercicioId: 'exercicio-1' },
      { ativo: false },
    );
    expect(midiaRepository.save).not.toHaveBeenCalled();
  });

  it('rejects approving an exercise without primary image', async () => {
    const { service, exercicioRepository, midiaRepository } = makeService();
    exercicioRepository.findOne.mockResolvedValue({
      id: 'exercicio-1',
      nome: 'Exercicio sem imagem',
      regiaoCorporal: 'LOMBAR',
      categoria: 'MOBILIDADE',
      nivel: 'INICIANTE',
      objetivo: 'Preparar revisao futura.',
      instrucoesPadrao: '1. Revisar antes de prescrever.',
      imagemKey: null,
      status: ExercicioStatus.RASCUNHO,
      ativo: true,
      versao: 1,
    });

    await expect(
      service.update(
        'exercicio-1',
        { status: ExercicioStatus.APROVADO },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(exercicioRepository.save).not.toHaveBeenCalled();
    expect(midiaRepository.save).not.toHaveBeenCalled();
    expect(midiaRepository.update).not.toHaveBeenCalled();
  });

  it('approves an exercise only when its primary media is clinically approved', async () => {
    const { service, exercicioRepository, midiaRepository } = makeService();
    const qb = makeQueryBuilder();
    const exercicio = {
      id: 'exercicio-1',
      nome: 'Ponte curta',
      regiaoCorporal: 'LOMBAR',
      categoria: 'FORTALECIMENTO',
      nivel: 'INICIANTE',
      objetivo: 'Ativar gluteos.',
      instrucoesPadrao: '1. Execute com controle.',
      imagemKey: 'PONTE_CURTA',
      status: ExercicioStatus.RASCUNHO,
      ativo: true,
      versao: 1,
    };
    const midia = {
      id: 'midia-1',
      exercicioId: 'exercicio-1',
      assetKey: 'PONTE_CURTA',
      ativo: true,
      revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.APROVADA,
      versao: 1,
    };
    exercicioRepository.findOne.mockResolvedValue(exercicio);
    exercicioRepository.save.mockImplementation(async (input) => input);
    midiaRepository.findOne.mockResolvedValue(midia);
    qb.getOne.mockResolvedValue({
      id: 'exercicio-1',
      status: ExercicioStatus.APROVADO,
      imagemKey: 'PONTE_CURTA',
      midias: [midia],
    });
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

    await expect(
      service.update(
        'exercicio-1',
        { status: ExercicioStatus.APROVADO },
        'admin-1',
      ),
    ).resolves.toMatchObject({
      id: 'exercicio-1',
      status: ExercicioStatus.APROVADO,
    });

    expect(exercicioRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ExercicioStatus.APROVADO,
        imagemKey: 'PONTE_CURTA',
        versao: 2,
      }),
    );
    expect(midiaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'midia-1',
        assetKey: 'PONTE_CURTA',
        ativo: true,
        versao: 2,
      }),
    );
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

  it('restores archived exercise as draft when admin changes status', async () => {
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
      status: ExercicioStatus.RASCUNHO,
    });
    exercicioRepository.createQueryBuilder.mockReturnValue(qb);

    await expect(
      service.update(
        'exercicio-1',
        { status: ExercicioStatus.RASCUNHO },
        'admin-1',
      ),
    ).resolves.toEqual({
      id: 'exercicio-1',
      ativo: true,
      status: ExercicioStatus.RASCUNHO,
    });

    expect(exercicioRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'exercicio-1' },
    });
    expect(exercicioRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ativo: true,
        status: ExercicioStatus.RASCUNHO,
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
