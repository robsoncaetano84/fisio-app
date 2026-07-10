import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Not, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateExercicioCatalogDto } from './dto/create-exercicio-catalog.dto';
import { UpdateExercicioMidiaStorageDto } from './dto/update-exercicio-midia-storage.dto';
import { UpdateExercicioMidiaClinicalReviewDto } from './dto/update-exercicio-midia-clinical-review.dto';
import { UpdateExercicioCatalogDto } from './dto/update-exercicio-catalog.dto';
import { Exercicio, ExercicioStatus } from './entities/exercicio.entity';
import {
  ExerciseTranslations,
  buildExerciseLocalization,
  normalizeExerciseTranslations,
} from './exercise-catalog-localization';
import {
  ExercicioMidia,
  ExercicioMidiaRevisaoClinicaStatus,
} from './entities/exercicio-midia.entity';
import {
  buildExercicioMidiaObjectKey,
  persistExercicioMidiaFile,
  UploadedExercicioMidiaFile,
} from './exercicio-midia-storage';
import { PREVIEW_EXERCISE_CATALOG } from './exercise-catalog-preview.seed';
import { INITIAL_EXERCISE_CATALOG } from './exercicio-catalog.seed';
import { MASTER_EXERCISE_CATALOG } from './exercise-catalog-master.seed';
import { RedisService } from '../../common/redis.service';

export type ExercicioCatalogFilters = {
  q?: string;
  regiaoCorporal?: string;
  categoria?: string;
  nivel?: string;
  tag?: string;
  includeDrafts?: boolean;
};

export const EXERCISE_IMAGE_QUEUE_STATUSES = [
  'SEM_IMAGEM',
  'SEM_MIDIA_PRINCIPAL',
  'IMAGEM_PENDENTE_REVISAO',
  'REGENERAR_IMAGEM',
  'AJUSTAR_TEXTO',
  'REMOVER_DO_CATALOGO',
] as const;

export type ExercicioImageQueueStatus =
  (typeof EXERCISE_IMAGE_QUEUE_STATUSES)[number];

export type ExercicioImageQueueFilters = Omit<
  ExercicioCatalogFilters,
  'includeDrafts'
> & {
  filaStatus?: string;
  limit?: string | number;
};

export type ExercicioImageQueueItem = {
  id: string;
  nome: string;
  slug: string;
  regiaoCorporal: string;
  categoria: string;
  nivel: string;
  exercicioStatus: ExercicioStatus;
  imagemKey: string | null;
  mediaReviewStatus: ExercicioMidiaRevisaoClinicaStatus | null;
  filaStatus: ExercicioImageQueueStatus;
  prioridade: number;
  tags: string[];
  translations: ExerciseTranslations;
};

export type ExercicioImageQueueAppliedFilters = {
  q: string | null;
  regiaoCorporal: string | null;
  categoria: string | null;
  nivel: string | null;
  tag: string | null;
  filaStatus: ExercicioImageQueueStatus | null;
  limit: number;
};

export type ExercicioImageQueueResponse = {
  total: number;
  limit: number;
  resumo: Record<ExercicioImageQueueStatus, number>;
  appliedFilters: ExercicioImageQueueAppliedFilters;
  items: ExercicioImageQueueItem[];
};

export type ExercicioImageProductionBrief = {
  exercicio: ExercicioImageQueueItem;
  imageKeySuggestion: string;
  assetFileNameSuggestion: string;
  assetPathSuggestion: string;
  tituloPaciente: string;
  descricaoPaciente: string;
  orientacaoProfissional: string;
  accessibilityLabel: string;
  productionMarkdown: string;
  objetivoImagem: string;
  promptBase: string;
  negativePrompt: string;
  enquadramento: string[];
  identidadeVisual: string[];
  criteriosClinicos: string[];
  checklistRevisao: string[];
  implementationChecklist: string[];
};

export type ExercicioImageProductionBriefsResponse = {
  total: number;
  limit: number;
  resumo: Record<ExercicioImageQueueStatus, number>;
  appliedFilters: ExercicioImageQueueAppliedFilters;
  productionMarkdownBatch: string;
  items: ExercicioImageProductionBrief[];
};

type ExercicioImageQueueCandidate = {
  exercicio: Exercicio;
  queueItem: ExercicioImageQueueItem;
};

const EXERCISE_IMAGE_VISUAL_STANDARD = [
  'Adulto neutro, sem identidade facial forte e sem aparência de pessoa real identificável.',
  'Roupa esportiva justa cinza-claro/off-white, sem logo e sem variação de figurino entre exercícios.',
  'Fundo claro, limpo e uniforme, sem cenário clínico poluído e sem objetos desnecessários.',
  'Corpo e roupa em tons suaves de cinza, com anatomia limpa e leitura boa em miniatura.',
  'Destaque verde Synap somente no músculo-alvo ou na direção do movimento, com setas discretas quando ajudarem a compreensão.',
  "Sem texto embutido, sem logo, sem assinatura, sem marca d'água e sem marca de terceiros.",
] as const;

const EXERCISE_IMAGE_VISUAL_REJECTION_CRITERIA = [
  'roupa escura, colorida, com logo ou diferente do padrão cinza-claro/off-white',
  'torso exposto, nudez anatômica, músculos expostos ou aparência de atlas anatômico sem roupa',
  'rosto borrado, identidade facial forte demais ou aparência de pessoa real identificável',
  'fundo escuro, cenário clínico poluído, sombras pesadas ou objetos que não fazem parte do exercício',
  'destaque verde excessivo, em região errada ou sem relação com o movimento prescrito',
  "texto embutido, marca d'água, assinatura, letras, números ou artefatos de geração",
  'pose clinicamente impossível, ambígua, com contralateralidade incorreta ou apoio incoerente',
  'recorte que prejudique mãos, pés, apoios, direção do movimento ou leitura em miniatura',
] as const;

const EXERCISE_IMAGE_NEGATIVE_PROMPT = [
  'logos externos',
  'texto na imagem',
  "marca d'água",
  'assinatura',
  'números',
  'letras',
  'pessoas reais identificáveis',
  'foto stock',
  'rosto borrado',
  'identidade facial forte',
  'variação forte de rosto entre assets',
  'roupa escura',
  'roupa colorida',
  'logo na roupa',
  'corpo sem roupa',
  'nudez anatômica',
  'tórax exposto',
  'músculos expostos como atlas anatômico',
  'baixa resolução',
  'anatomia deformada',
  'membros extras',
  'lado errado',
  'articulações impossíveis',
  'apoio incoerente',
  'amplitude agressiva',
  'fundo poluído',
  'objetos desnecessários',
] as const;

export type ExercicioSuggestionMatchInput = {
  titulo?: string | null;
  descricao?: string | null;
  instrucoesExecucao?: string | null;
  imagemTipo?: string | null;
};

@Injectable()
export class ExerciciosCatalogService implements OnModuleInit {
  constructor(
    @InjectRepository(Exercicio)
    private readonly exercicioRepository: Repository<Exercicio>,
    @InjectRepository(ExercicioMidia)
    private readonly midiaRepository: Repository<ExercicioMidia>,
    @Optional()
    private readonly redisService?: RedisService,
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV !== 'development') return;
    if (process.env.EXERCISE_CATALOG_AUTO_SEED === 'false') return;
    await this.seedInitialCatalogIfEmpty();
  }

  async findAll(filters: ExercicioCatalogFilters = {}): Promise<Exercicio[]> {
    return this.rememberCache(
      this.buildCacheKey('exercicios:list', filters),
      this.getCacheTtlSeconds(false),
      () => this.findAllFromDatabase(filters),
    );
  }

  private async findAllFromDatabase(
    filters: ExercicioCatalogFilters = {},
  ): Promise<Exercicio[]> {
    const qb = this.exercicioRepository.createQueryBuilder('exercicio');

    if (filters.includeDrafts) {
      this.joinActiveMedia(qb);
      qb.where('1 = 1');
    } else {
      this.joinClinicallyApprovedPrimaryMedia(qb);
      qb.where('exercicio.ativo = :ativo', { ativo: true }).andWhere(
        'exercicio.status = :status',
        {
          status: ExercicioStatus.APROVADO,
        },
      );
    }

    if (filters.regiaoCorporal) {
      qb.andWhere('exercicio.regiaoCorporal = :regiaoCorporal', {
        regiaoCorporal: filters.regiaoCorporal.trim().toUpperCase(),
      });
    }

    if (filters.categoria) {
      qb.andWhere('exercicio.categoria = :categoria', {
        categoria: filters.categoria.trim().toUpperCase(),
      });
    }

    if (filters.nivel) {
      qb.andWhere('exercicio.nivel = :nivel', {
        nivel: filters.nivel.trim().toUpperCase(),
      });
    }

    if (filters.tag) {
      qb.andWhere('exercicio.tags @> :tag::jsonb', {
        tag: JSON.stringify([filters.tag.trim().toLowerCase()]),
      });
    }

    if (filters.q?.trim()) {
      const q = `%${filters.q.trim()}%`;
      qb.andWhere(
        new Brackets((inner) => {
          inner
            .where('exercicio.nome ILIKE :q', { q })
            .orWhere('exercicio.slug ILIKE :q', { q })
            .orWhere('exercicio.regiaoCorporal ILIKE :q', { q })
            .orWhere('exercicio.categoria ILIKE :q', { q })
            .orWhere('exercicio.nivel ILIKE :q', { q })
            .orWhere('exercicio.imagemKey ILIKE :q', { q })
            .orWhere('exercicio.objetivo ILIKE :q', { q })
            .orWhere('exercicio.descricao ILIKE :q', { q })
            .orWhere('CAST(exercicio.translations AS TEXT) ILIKE :q', { q })
            .orWhere('CAST(exercicio.tags AS TEXT) ILIKE :q', { q });
        }),
      );
    }

    return qb
      .orderBy('exercicio.regiaoCorporal', 'ASC')
      .addOrderBy('exercicio.nome', 'ASC')
      .getMany();
  }

  async findImageProductionQueue(
    filters: ExercicioImageQueueFilters = {},
  ): Promise<ExercicioImageQueueResponse> {
    const { candidates, limit, resumo, appliedFilters } =
      await this.findImageQueueCandidates(filters);

    return {
      total: candidates.length,
      limit,
      resumo,
      appliedFilters,
      items: candidates.slice(0, limit).map((candidate) => candidate.queueItem),
    };
  }

  async findImageProductionBriefs(
    filters: ExercicioImageQueueFilters = {},
  ): Promise<ExercicioImageProductionBriefsResponse> {
    const { candidates, limit, resumo, appliedFilters } =
      await this.findImageQueueCandidates(filters);
    const items = candidates
      .slice(0, limit)
      .map(({ exercicio, queueItem }) =>
        this.buildImageProductionBrief(exercicio, queueItem),
      );

    return {
      total: candidates.length,
      limit,
      resumo,
      appliedFilters,
      productionMarkdownBatch: this.buildImageProductionBatchMarkdown(
        items,
        appliedFilters,
        candidates.length,
      ),
      items,
    };
  }

  async getImageProductionBrief(
    id: string,
  ): Promise<ExercicioImageProductionBrief> {
    const exercicio = await this.findOneForAdmin(id);
    if (!exercicio) {
      throw new NotFoundException('Exercício não encontrado');
    }
    if (!exercicio.ativo || exercicio.status === ExercicioStatus.ARQUIVADO) {
      throw new BadRequestException(
        'Exercício arquivado não entra na produção de imagem',
      );
    }

    const queueItem = this.toImageQueueItem(exercicio);
    if (!queueItem) {
      throw new BadRequestException(
        'Exercício não está na fila de produção de imagem',
      );
    }

    return this.buildImageProductionBrief(exercicio, queueItem);
  }

  async findOne(id: string): Promise<Exercicio | null> {
    const qb = this.exercicioRepository.createQueryBuilder('exercicio');
    this.joinClinicallyApprovedPrimaryMedia(qb);

    return qb
      .where('exercicio.id = :id', { id })
      .andWhere('exercicio.ativo = :ativo', { ativo: true })
      .andWhere('exercicio.status = :status', {
        status: ExercicioStatus.APROVADO,
      })
      .getOne();
  }

  async findApprovedById(id: string): Promise<Exercicio | null> {
    return this.findOne(id);
  }

  async findOneForAdmin(id: string): Promise<Exercicio | null> {
    return this.exercicioRepository
      .createQueryBuilder('exercicio')
      .leftJoinAndSelect(
        'exercicio.midias',
        'midia',
        'midia.ativo = :midiaAtiva',
        { midiaAtiva: true },
      )
      .where('exercicio.id = :id', { id })
      .getOne();
  }

  async create(
    dto: CreateExercicioCatalogDto,
    usuarioId: string,
  ): Promise<Exercicio> {
    const nome = this.normalizeRequiredString(dto.nome, 'nome');
    const regiaoCorporal = this.normalizeRequiredString(
      dto.regiaoCorporal,
      'regiaoCorporal',
    );
    const categoria = this.normalizeRequiredString(dto.categoria, 'categoria');
    const nivel = this.normalizeRequiredString(dto.nivel, 'nivel');
    const objetivo = this.normalizeRequiredString(dto.objetivo, 'objetivo');
    const instrucoesPadrao = this.normalizeRequiredString(
      dto.instrucoesPadrao,
      'instrucoesPadrao',
    );
    const slug = await this.resolveUniqueSlug(dto.slug || nome);
    const imagemKey = this.normalizeOptionalString(dto.imagemKey);
    const status = dto.status ?? ExercicioStatus.RASCUNHO;
    const localization = buildExerciseLocalization({
      nome,
      slug,
      regiaoCorporal,
      categoria,
      nivel,
      objetivo,
      descricao: dto.descricao,
      instrucoesPadrao,
      cuidados: dto.cuidados,
      contraindicacoes: dto.contraindicacoes,
    });
    const pt = localization.pt;
    await this.assertApprovalRequirements(status, imagemKey);
    const exercicio = await this.exercicioRepository.save(
      this.exercicioRepository.create({
        nome: pt.nome,
        slug,
        regiaoCorporal: regiaoCorporal.toUpperCase(),
        categoria: categoria.toUpperCase(),
        nivel: nivel.toUpperCase(),
        objetivo: pt.objetivo,
        descricao: this.normalizeOptionalString(pt.descricao),
        instrucoesPadrao: pt.instrucoesPadrao,
        cuidados: this.normalizeOptionalString(pt.cuidados),
        contraindicacoes: this.normalizeOptionalString(pt.contraindicacoes),
        imagemKey,
        tags: this.normalizeTags(dto.tags),
        translations: normalizeExerciseTranslations(dto.translations, {
          ...pt,
          slug,
          regiaoCorporal,
          categoria,
          nivel,
        }),
        status,
        versao: 1,
        revisadoPorUsuarioId: usuarioId,
        revisadoEm: new Date(),
        ativo: status !== ExercicioStatus.ARQUIVADO,
      }),
    );

    await this.syncPrimaryMedia(exercicio, usuarioId);
    await this.invalidateExerciseCatalogCache();
    return (await this.findOneForAdmin(exercicio.id)) ?? exercicio;
  }

  async update(
    id: string,
    dto: UpdateExercicioCatalogDto,
    usuarioId: string,
  ): Promise<Exercicio> {
    const exercicio = await this.exercicioRepository.findOne({
      where: { id },
    });
    if (!exercicio) {
      throw new NotFoundException('Exercicio nao encontrado');
    }

    if (typeof dto.nome === 'string') {
      exercicio.nome = this.normalizeRequiredString(dto.nome, 'nome');
    }
    if (typeof dto.slug === 'string') {
      exercicio.slug = await this.resolveUniqueSlug(dto.slug, exercicio.id);
    }
    if (typeof dto.regiaoCorporal === 'string') {
      exercicio.regiaoCorporal = this.normalizeRequiredString(
        dto.regiaoCorporal,
        'regiaoCorporal',
      ).toUpperCase();
    }
    if (typeof dto.categoria === 'string') {
      exercicio.categoria = this.normalizeRequiredString(
        dto.categoria,
        'categoria',
      ).toUpperCase();
    }
    if (typeof dto.nivel === 'string') {
      exercicio.nivel = this.normalizeRequiredString(
        dto.nivel,
        'nivel',
      ).toUpperCase();
    }
    if (typeof dto.objetivo === 'string') {
      exercicio.objetivo = this.normalizeRequiredString(
        dto.objetivo,
        'objetivo',
      );
    }
    if (typeof dto.descricao === 'string') {
      exercicio.descricao = this.normalizeOptionalString(dto.descricao);
    }
    if (typeof dto.instrucoesPadrao === 'string') {
      exercicio.instrucoesPadrao = this.normalizeRequiredString(
        dto.instrucoesPadrao,
        'instrucoesPadrao',
      );
    }
    if (typeof dto.cuidados === 'string') {
      exercicio.cuidados = this.normalizeOptionalString(dto.cuidados);
    }
    if (typeof dto.contraindicacoes === 'string') {
      exercicio.contraindicacoes = this.normalizeOptionalString(
        dto.contraindicacoes,
      );
    }
    if (dto.imagemKey !== undefined) {
      exercicio.imagemKey = this.normalizeOptionalString(dto.imagemKey);
    }
    if (Array.isArray(dto.tags)) {
      exercicio.tags = this.normalizeTags(dto.tags);
    }
    if (dto.status) {
      exercicio.status = dto.status;
      exercicio.ativo = dto.status !== ExercicioStatus.ARQUIVADO;
    }
    const localization = buildExerciseLocalization(exercicio);
    exercicio.nome = localization.pt.nome;
    exercicio.objetivo = localization.pt.objetivo;
    exercicio.descricao = this.normalizeOptionalString(
      localization.pt.descricao,
    );
    exercicio.instrucoesPadrao = localization.pt.instrucoesPadrao;
    exercicio.cuidados = this.normalizeOptionalString(localization.pt.cuidados);
    exercicio.contraindicacoes = this.normalizeOptionalString(
      localization.pt.contraindicacoes,
    );
    exercicio.translations = normalizeExerciseTranslations(
      dto.translations ?? exercicio.translations,
      {
        nome: exercicio.nome,
        slug: exercicio.slug,
        regiaoCorporal: exercicio.regiaoCorporal,
        categoria: exercicio.categoria,
        nivel: exercicio.nivel,
        objetivo: exercicio.objetivo,
        descricao: exercicio.descricao,
        instrucoesPadrao: exercicio.instrucoesPadrao,
        cuidados: exercicio.cuidados,
        contraindicacoes: exercicio.contraindicacoes,
      },
    );
    await this.assertApprovalRequirements(
      exercicio.status,
      exercicio.imagemKey,
      exercicio.id,
    );

    exercicio.versao += 1;
    exercicio.revisadoPorUsuarioId = usuarioId;
    exercicio.revisadoEm = new Date();

    const saved = await this.exercicioRepository.save(exercicio);
    await this.syncPrimaryMedia(saved, usuarioId);
    await this.invalidateExerciseCatalogCache();
    return (await this.findOneForAdmin(saved.id)) ?? saved;
  }

  async archive(id: string, usuarioId: string): Promise<{ success: true }> {
    const exercicio = await this.exercicioRepository.findOne({
      where: { id, ativo: true },
    });
    if (!exercicio) {
      throw new NotFoundException('Exercicio nao encontrado');
    }

    exercicio.status = ExercicioStatus.ARQUIVADO;
    exercicio.ativo = false;
    exercicio.versao += 1;
    exercicio.revisadoPorUsuarioId = usuarioId;
    exercicio.revisadoEm = new Date();
    await this.exercicioRepository.save(exercicio);
    await this.midiaRepository.update({ exercicioId: id }, { ativo: false });
    await this.invalidateExerciseCatalogCache();
    return { success: true };
  }

  async reviewPrimaryMedia(
    id: string,
    dto: UpdateExercicioMidiaClinicalReviewDto,
    usuarioId: string,
  ): Promise<Exercicio> {
    const exercicio = await this.exercicioRepository.findOne({
      where: { id },
    });
    if (!exercicio) {
      throw new NotFoundException('Exercicio nao encontrado');
    }
    if (!exercicio.imagemKey) {
      throw new BadRequestException('Exercicio sem imagem principal');
    }

    const midia = await this.midiaRepository.findOne({
      where: {
        exercicioId: exercicio.id,
        assetKey: exercicio.imagemKey,
        ativo: true,
      },
    });
    if (!midia) {
      throw new NotFoundException('Midia principal nao encontrada');
    }

    midia.revisaoClinicaStatus = dto.status;
    midia.revisaoClinicaObservacao = this.normalizeOptionalString(
      dto.observacao,
    );
    midia.revisaoClinicaPorUsuarioId = usuarioId;
    midia.revisaoClinicaEm = new Date();
    midia.versao += 1;
    await this.midiaRepository.save(midia);
    await this.invalidateExerciseCatalogCache();

    return (await this.findOneForAdmin(exercicio.id)) ?? exercicio;
  }

  // Etapa-38 F3: upload de imagem do exercicio pelo backend (Supabase/fallback
  // local). Toda imagem enviada entra como revisao clinica PENDENTE — so vira
  // prescritivel apos aprovacao humana.
  async uploadPrimaryMedia(
    id: string,
    file: UploadedExercicioMidiaFile,
    usuarioId: string,
  ): Promise<Exercicio> {
    const exercicio = await this.exercicioRepository.findOne({ where: { id } });
    if (!exercicio) {
      throw new NotFoundException('Exercicio nao encontrado');
    }
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('Arquivo de imagem obrigatorio');
    }
    const allowedMime = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedMime.includes(file.mimetype)) {
      throw new BadRequestException('Formato invalido (use PNG, JPEG ou WEBP)');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Imagem excede o limite de 5MB');
    }

    const assetKey = exercicio.imagemKey || exercicio.slug;
    const objectKey = buildExercicioMidiaObjectKey(assetKey, file.originalname);
    const { storagePath, imageUrl } = await persistExercicioMidiaFile({
      objectKey,
      mimeType: file.mimetype,
      fileBuffer: file.buffer,
    });

    let midia = await this.midiaRepository.findOne({
      where: { exercicioId: exercicio.id, assetKey },
    });
    if (!midia) {
      midia = this.midiaRepository.create({
        exercicioId: exercicio.id,
        assetKey,
        tipo: 'UPLOAD',
        sourceType: 'UPLOAD',
        license: 'PROPRIETARIO',
        versao: 0,
      });
    }
    midia.sourceType = 'UPLOAD';
    midia.storagePath = storagePath;
    midia.imageUrl = imageUrl;
    midia.thumbnailUrl = imageUrl;
    midia.mimeType = file.mimetype;
    midia.bytes = file.size;
    if (!midia.license) midia.license = 'PROPRIETARIO';
    midia.ativo = true;
    midia.revisaoClinicaStatus = ExercicioMidiaRevisaoClinicaStatus.PENDENTE;
    midia.revisaoClinicaObservacao = null;
    midia.revisaoClinicaPorUsuarioId = null;
    midia.revisaoClinicaEm = null;
    midia.revisadoPorUsuarioId = usuarioId;
    midia.revisadoEm = new Date();
    midia.versao = (midia.versao ?? 0) + 1;
    await this.midiaRepository.save(midia);

    if (exercicio.imagemKey !== assetKey) {
      exercicio.imagemKey = assetKey;
      await this.exercicioRepository.save(exercicio);
    }
    await this.invalidateExerciseCatalogCache();
    return (await this.findOneForAdmin(exercicio.id)) ?? exercicio;
  }

  async updatePrimaryMediaStorage(
    id: string,
    dto: UpdateExercicioMidiaStorageDto,
    usuarioId: string,
  ): Promise<Exercicio> {
    const exercicio = await this.exercicioRepository.findOne({
      where: { id },
    });
    if (!exercicio) {
      throw new NotFoundException('Exercicio nao encontrado');
    }
    if (!exercicio.imagemKey) {
      throw new BadRequestException('Exercicio sem imagem principal');
    }

    await this.syncPrimaryMedia(exercicio, usuarioId);
    const midia = await this.midiaRepository.findOne({
      where: {
        exercicioId: exercicio.id,
        assetKey: exercicio.imagemKey,
        ativo: true,
      },
    });
    if (!midia) {
      throw new NotFoundException('Midia principal nao encontrada');
    }

    const changedVisualSource = this.applyMediaStorageMetadata(midia, dto);
    if (changedVisualSource) {
      midia.revisaoClinicaStatus = ExercicioMidiaRevisaoClinicaStatus.PENDENTE;
      midia.revisaoClinicaObservacao = null;
      midia.revisaoClinicaPorUsuarioId = null;
      midia.revisaoClinicaEm = null;
    }
    midia.revisadoPorUsuarioId = usuarioId;
    midia.revisadoEm = new Date();
    midia.versao += 1;

    await this.midiaRepository.save(midia);
    await this.invalidateExerciseCatalogCache();
    return (await this.findOneForAdmin(exercicio.id)) ?? exercicio;
  }

  /**
   * Retorna exercicios aprovados e com midia clinicamente aprovada para serem
   * candidatos a um plano terapeutico. Quando `regioes` e informado, restringe
   * por correspondencia parcial de regiaoCorporal (ex.: 'LOMBAR' casa
   * 'LOMBAR', 'LOMBAR_QUADRIL' e 'TORACICA_LOMBAR_CORE').
   */
  async findCandidatosParaRecomendacao(
    regioes: string[] = [],
  ): Promise<Exercicio[]> {
    const tokens = Array.from(
      new Set(
        (regioes || [])
          .map((regiao) => regiao?.trim().toUpperCase())
          .filter((regiao): regiao is string => Boolean(regiao)),
      ),
    );

    return this.rememberCache(
      this.buildCacheKey('exercicios:recomendacao', { regioes: tokens }),
      this.getCacheTtlSeconds(false),
      async () => {
        const qb = this.exercicioRepository.createQueryBuilder('exercicio');
        this.joinClinicallyApprovedPrimaryMedia(qb);
        qb.where('exercicio.ativo = :ativo', { ativo: true }).andWhere(
          'exercicio.status = :status',
          { status: ExercicioStatus.APROVADO },
        );

        if (tokens.length) {
          qb.andWhere(
            new Brackets((inner) => {
              tokens.forEach((token, index) => {
                const param = `regiaoToken${index}`;
                inner.orWhere(`exercicio.regiaoCorporal ILIKE :${param}`, {
                  [param]: `%${token}%`,
                });
              });
            }),
          );
        }

        return qb
          .orderBy('exercicio.regiaoCorporal', 'ASC')
          .addOrderBy('exercicio.nome', 'ASC')
          .getMany();
      },
    );
  }

  async findBestMatchForSuggestion(
    input: ExercicioSuggestionMatchInput,
  ): Promise<Exercicio | null> {
    const qb = this.exercicioRepository.createQueryBuilder('exercicio');
    this.joinClinicallyApprovedPrimaryMedia(qb);
    const candidates = await qb
      .where('exercicio.ativo = :ativo', { ativo: true })
      .andWhere('exercicio.status = :status', {
        status: ExercicioStatus.APROVADO,
      })
      .orderBy('exercicio.regiaoCorporal', 'ASC')
      .addOrderBy('exercicio.nome', 'ASC')
      .getMany();
    if (!candidates.length) return null;

    const context = this.normalizeForMatch(
      [
        input.titulo,
        input.descricao,
        input.instrucoesExecucao,
        input.imagemTipo,
      ].join(' '),
    );
    const imagemTipo = String(input.imagemTipo || '')
      .trim()
      .toUpperCase();

    let best: { exercicio: Exercicio; score: number } | null = null;
    for (const exercicio of candidates) {
      const score = this.scoreSuggestionCandidate(
        exercicio,
        context,
        imagemTipo,
      );
      if (!best || score > best.score) {
        best = { exercicio, score };
      }
    }

    return best && best.score > 0 ? best.exercicio : null;
  }

  private async seedInitialCatalogIfEmpty(): Promise<void> {
    const total = await this.exercicioRepository.count();
    if (total > 0) return;

    const seenSlugs = new Set<string>();
    const catalogo = [
      ...INITIAL_EXERCISE_CATALOG,
      ...PREVIEW_EXERCISE_CATALOG,
      ...MASTER_EXERCISE_CATALOG,
    ].filter((item) => {
      if (seenSlugs.has(item.slug)) return false;
      seenSlugs.add(item.slug);
      return true;
    });

    for (const item of catalogo) {
      const localization = buildExerciseLocalization(item);
      const exercicio = await this.exercicioRepository.save(
        this.exercicioRepository.create({
          ...item,
          ...localization.pt,
          translations: localization.translations,
          revisadoEm: new Date(),
          ativo: item.status !== ExercicioStatus.ARQUIVADO,
          versao: 1,
        }),
      );

      // Itens do catalogo mestre entram sem imagemKey (RASCUNHO ate ter imagem
      // propria); so criamos midia principal quando ha uma chave de imagem.
      if (item.imagemKey) {
        await this.midiaRepository.save(
          this.midiaRepository.create({
            exercicioId: exercicio.id,
            assetKey: item.imagemKey,
            tipo: 'ILUSTRACAO',
            sourceType: 'PROPRIA',
            sourceUrl: null,
            author: 'Synap',
            license: 'PROPRIETARIA_SYNAP',
            licenseUrl: null,
            attributionText: 'Ilustracao propria Synap.',
            revisadoEm: new Date(),
            revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.PENDENTE,
            ativo: true,
            versao: 1,
          }),
        );
      }
    }
  }

  private joinActiveMedia(
    qb: SelectQueryBuilder<Exercicio>,
  ): SelectQueryBuilder<Exercicio> {
    return qb.leftJoinAndSelect(
      'exercicio.midias',
      'midia',
      'midia.ativo = :midiaAtiva',
      { midiaAtiva: true },
    );
  }

  private joinClinicallyApprovedPrimaryMedia(
    qb: SelectQueryBuilder<Exercicio>,
  ): SelectQueryBuilder<Exercicio> {
    return qb.innerJoinAndSelect(
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
  }

  private async syncPrimaryMedia(
    exercicio: Exercicio,
    usuarioId: string,
  ): Promise<void> {
    if (!exercicio.ativo || exercicio.status === ExercicioStatus.ARQUIVADO) {
      await this.midiaRepository.update(
        { exercicioId: exercicio.id },
        { ativo: false },
      );
      return;
    }

    if (!exercicio.imagemKey) {
      await this.midiaRepository.update(
        { exercicioId: exercicio.id },
        { ativo: false },
      );
      return;
    }

    await this.midiaRepository.update(
      {
        exercicioId: exercicio.id,
        ativo: true,
        assetKey: Not(exercicio.imagemKey),
      },
      { ativo: false },
    );

    const existing = await this.midiaRepository.findOne({
      where: {
        exercicioId: exercicio.id,
        assetKey: exercicio.imagemKey,
      },
    });
    if (existing) {
      existing.tipo = 'ILUSTRACAO';
      this.applyDefaultMediaOwnership(existing);
      existing.author = 'Synap';
      existing.license = 'PROPRIETARIA_SYNAP';
      existing.licenseUrl = null;
      existing.attributionText = 'Ilustracao propria Synap.';
      existing.ativo = true;
      existing.revisadoPorUsuarioId = usuarioId;
      existing.revisadoEm = new Date();
      existing.versao += 1;
      await this.midiaRepository.save(existing);
      return;
    }

    await this.midiaRepository.save(
      this.midiaRepository.create({
        exercicioId: exercicio.id,
        assetKey: exercicio.imagemKey,
        tipo: 'ILUSTRACAO',
        sourceType: 'PROPRIA',
        sourceUrl: null,
        author: 'Synap',
        license: 'PROPRIETARIA_SYNAP',
        licenseUrl: null,
        attributionText: 'Ilustracao propria Synap.',
        versao: exercicio.versao,
        revisadoPorUsuarioId: usuarioId,
        revisadoEm: new Date(),
        revisaoClinicaStatus: ExercicioMidiaRevisaoClinicaStatus.PENDENTE,
        ativo: true,
      }),
    );
  }

  private applyMediaStorageMetadata(
    midia: ExercicioMidia,
    dto: UpdateExercicioMidiaStorageDto,
  ): boolean {
    const previousStoragePath = midia.storagePath;
    const previousThumbnailUrl = midia.thumbnailUrl;
    const previousImageUrl = midia.imageUrl;

    if (this.hasOwn(dto, 'storagePath')) {
      midia.storagePath = this.normalizeOptionalStoragePath(dto.storagePath);
    }
    if (this.hasOwn(dto, 'thumbnailUrl')) {
      midia.thumbnailUrl = this.normalizeOptionalUrl(
        dto.thumbnailUrl,
        'thumbnailUrl',
      );
    }
    if (this.hasOwn(dto, 'imageUrl')) {
      midia.imageUrl = this.normalizeOptionalUrl(dto.imageUrl, 'imageUrl');
    }
    if (this.hasOwn(dto, 'sourceUrl')) {
      midia.sourceUrl = this.normalizeOptionalUrl(dto.sourceUrl, 'sourceUrl');
    }
    if (this.hasOwn(dto, 'mimeType')) {
      midia.mimeType = this.normalizeOptionalMimeType(dto.mimeType);
    }
    if (this.hasOwn(dto, 'width')) {
      midia.width = dto.width ?? null;
    }
    if (this.hasOwn(dto, 'height')) {
      midia.height = dto.height ?? null;
    }
    if (this.hasOwn(dto, 'bytes')) {
      midia.bytes = dto.bytes ?? null;
    }

    this.applyDefaultMediaOwnership(midia);

    return (
      previousStoragePath !== midia.storagePath ||
      previousThumbnailUrl !== midia.thumbnailUrl ||
      previousImageUrl !== midia.imageUrl
    );
  }

  private applyDefaultMediaOwnership(midia: ExercicioMidia): void {
    const remoteUrl = midia.imageUrl || midia.thumbnailUrl || midia.sourceUrl;
    const hasRemoteStorage = Boolean(midia.storagePath || remoteUrl);
    midia.sourceType = hasRemoteStorage ? 'SUPABASE_STORAGE' : 'PROPRIA';
    midia.sourceUrl = remoteUrl || null;
    midia.author = 'Synap';
    midia.license = 'PROPRIETARIA_SYNAP';
    midia.licenseUrl = null;
    midia.attributionText = 'Ilustracao propria Synap.';
  }

  private hasOwn<T extends object>(target: T, key: keyof T): boolean {
    return Object.hasOwn(target, key);
  }

  private normalizeOptionalStoragePath(value: unknown): string | null {
    const normalized = this.normalizeOptionalString(value);
    if (!normalized) return null;
    if (normalized.includes('..') || normalized.startsWith('/')) {
      throw new BadRequestException('storagePath invalido');
    }
    return normalized.replace(/\\/g, '/');
  }

  private normalizeOptionalUrl(value: unknown, field: string): string | null {
    const normalized = this.normalizeOptionalString(value);
    if (!normalized) return null;
    try {
      const parsed = new URL(normalized);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('invalid_protocol');
      }
      return parsed.toString();
    } catch {
      throw new BadRequestException(`${field} invalido`);
    }
  }

  private normalizeOptionalMimeType(value: unknown): string | null {
    const normalized = this.normalizeOptionalString(value);
    if (!normalized) return null;
    if (!/^image\/[a-z0-9.+-]+$/i.test(normalized)) {
      throw new BadRequestException('mimeType invalido');
    }
    return normalized.toLowerCase();
  }

  private async resolveUniqueSlug(
    value: string,
    currentId?: string,
  ): Promise<string> {
    const slug = this.toSlug(value);
    const existing = await this.exercicioRepository.findOne({
      where: currentId ? { slug, id: Not(currentId) } : { slug },
    });
    if (existing) {
      throw new ConflictException('Ja existe exercicio com este slug');
    }
    return slug;
  }

  private toSlug(value: string): string {
    const slug = this.normalizeForMatch(value)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 160);
    if (!slug) {
      throw new ConflictException('Slug invalido para o exercicio');
    }
    return slug;
  }

  private normalizeOptionalString(value?: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      return null;
    }
    const trimmed = String(value).trim();
    return trimmed || null;
  }

  private async rememberCache<T>(
    key: string,
    ttlSeconds: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    if (!this.redisService) return factory();
    return this.redisService.remember(key, ttlSeconds, factory);
  }

  private async invalidateExerciseCatalogCache(): Promise<void> {
    await this.redisService?.deleteByPrefix('exercicios:');
  }

  private getCacheTtlSeconds(heavy: boolean): number {
    const envKey = heavy ? 'CACHE_HEAVY_TTL_SECONDS' : 'CACHE_TTL_SECONDS';
    const raw = Number(process.env[envKey] || (heavy ? 120 : 60));
    return Number.isFinite(raw) ? Math.max(1, Math.floor(raw)) : 60;
  }

  private buildCacheKey(prefix: string, value: unknown): string {
    return `${prefix}:${this.hashCacheValue(this.stableStringify(value))}`;
  }

  private stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      return `{${Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => `${key}:${this.stableStringify(item)}`)
        .join(',')}}`;
    }
    return JSON.stringify(value);
  }

  private hashCacheValue(value: string): string {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }
    return hash.toString(36);
  }

  private normalizeRequiredString(value: string, field: string): string {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      throw new BadRequestException(`${field} e obrigatorio`);
    }
    return trimmed;
  }

  private normalizeTags(tags?: string[]): string[] {
    if (!tags?.length) return [];
    return Array.from(
      new Set(
        tags
          .map((tag) =>
            this.normalizeForMatch(tag)
              .replace(/[^a-z0-9]+/g, '_')
              .replace(/^_+|_+$/g, ''),
          )
          .filter(Boolean),
      ),
    ).slice(0, 30);
  }

  private async assertApprovalRequirements(
    status: ExercicioStatus,
    imagemKey: string | null,
    exercicioId?: string,
  ): Promise<void> {
    if (status !== ExercicioStatus.APROVADO) return;

    if (!imagemKey) {
      throw new BadRequestException(
        'Exercicio aprovado precisa ter imagem principal',
      );
    }
    const primaryAssetKey = imagemKey;

    if (!exercicioId) {
      throw new BadRequestException(
        'Exercicio aprovado precisa ter midia principal aprovada',
      );
    }

    const primaryMedia = await this.midiaRepository.findOne({
      where: {
        exercicioId,
        assetKey: primaryAssetKey,
        ativo: true,
      },
    });
    if (
      primaryMedia?.revisaoClinicaStatus !==
      ExercicioMidiaRevisaoClinicaStatus.APROVADA
    ) {
      throw new BadRequestException(
        'Exercicio aprovado precisa ter midia principal aprovada',
      );
    }
  }

  private async findImageQueueCandidates(
    filters: ExercicioImageQueueFilters = {},
  ): Promise<{
    candidates: ExercicioImageQueueCandidate[];
    limit: number;
    resumo: Record<ExercicioImageQueueStatus, number>;
    appliedFilters: ExercicioImageQueueAppliedFilters;
  }> {
    const filaStatus = this.normalizeQueueStatus(filters.filaStatus);
    const limit = this.normalizeQueueLimit(filters.limit);
    const appliedFilters = this.buildImageQueueAppliedFilters(
      filters,
      filaStatus,
      limit,
    );
    const qb = this.exercicioRepository.createQueryBuilder('exercicio');

    qb.leftJoinAndSelect(
      'exercicio.midias',
      'midia',
      [
        'midia.ativo = :midiaAtiva',
        'midia.assetKey = exercicio.imagemKey',
      ].join(' AND '),
      { midiaAtiva: true },
    )
      .where('exercicio.ativo = :ativo', { ativo: true })
      .andWhere('exercicio.status != :arquivado', {
        arquivado: ExercicioStatus.ARQUIVADO,
      })
      .andWhere(
        new Brackets((inner) => {
          inner
            .where('exercicio.imagemKey IS NULL')
            .orWhere('midia.id IS NULL')
            .orWhere('midia.revisaoClinicaStatus != :aprovada', {
              aprovada: ExercicioMidiaRevisaoClinicaStatus.APROVADA,
            });
        }),
      );

    if (filters.regiaoCorporal) {
      qb.andWhere('exercicio.regiaoCorporal = :regiaoCorporal', {
        regiaoCorporal: filters.regiaoCorporal.trim().toUpperCase(),
      });
    }

    if (filters.categoria) {
      qb.andWhere('exercicio.categoria = :categoria', {
        categoria: filters.categoria.trim().toUpperCase(),
      });
    }

    if (filters.nivel) {
      qb.andWhere('exercicio.nivel = :nivel', {
        nivel: filters.nivel.trim().toUpperCase(),
      });
    }

    if (filters.tag) {
      qb.andWhere('exercicio.tags @> :tag::jsonb', {
        tag: JSON.stringify([filters.tag.trim().toLowerCase()]),
      });
    }

    if (filters.q?.trim()) {
      const q = `%${filters.q.trim()}%`;
      qb.andWhere(
        new Brackets((inner) => {
          inner
            .where('exercicio.nome ILIKE :q', { q })
            .orWhere('exercicio.slug ILIKE :q', { q })
            .orWhere('exercicio.regiaoCorporal ILIKE :q', { q })
            .orWhere('exercicio.categoria ILIKE :q', { q })
            .orWhere('exercicio.nivel ILIKE :q', { q })
            .orWhere('exercicio.imagemKey ILIKE :q', { q })
            .orWhere('exercicio.objetivo ILIKE :q', { q })
            .orWhere('exercicio.descricao ILIKE :q', { q })
            .orWhere('CAST(exercicio.translations AS TEXT) ILIKE :q', { q })
            .orWhere('CAST(exercicio.tags AS TEXT) ILIKE :q', { q });
        }),
      );
    }

    const exercises = await qb
      .orderBy('exercicio.regiaoCorporal', 'ASC')
      .addOrderBy('exercicio.nome', 'ASC')
      .getMany();
    const candidates = exercises
      .map((exercicio) => {
        const queueItem = this.toImageQueueItem(exercicio);
        return queueItem ? { exercicio, queueItem } : null;
      })
      .filter((candidate): candidate is ExercicioImageQueueCandidate =>
        Boolean(candidate),
      )
      .filter(
        (candidate) =>
          !filaStatus || candidate.queueItem.filaStatus === filaStatus,
      )
      .sort(
        (a, b) =>
          b.queueItem.prioridade - a.queueItem.prioridade ||
          a.queueItem.regiaoCorporal.localeCompare(
            b.queueItem.regiaoCorporal,
          ) ||
          a.queueItem.nome.localeCompare(b.queueItem.nome),
      );
    const resumo = this.createImageQueueSummary(
      candidates.map((candidate) => candidate.queueItem),
    );

    return { candidates, limit, resumo, appliedFilters };
  }

  private buildImageQueueAppliedFilters(
    filters: ExercicioImageQueueFilters,
    filaStatus: ExercicioImageQueueStatus | null,
    limit: number,
  ): ExercicioImageQueueAppliedFilters {
    return {
      q: this.normalizeOptionalString(filters.q),
      regiaoCorporal:
        this.normalizeOptionalString(filters.regiaoCorporal)?.toUpperCase() ??
        null,
      categoria:
        this.normalizeOptionalString(filters.categoria)?.toUpperCase() ?? null,
      nivel: this.normalizeOptionalString(filters.nivel)?.toUpperCase() ?? null,
      tag: this.normalizeOptionalString(filters.tag)?.toLowerCase() ?? null,
      filaStatus,
      limit,
    };
  }

  private normalizeQueueStatus(
    value?: string | null,
  ): ExercicioImageQueueStatus | null {
    const status = String(value || '')
      .trim()
      .toUpperCase();
    if (!status) return null;
    if (
      !EXERCISE_IMAGE_QUEUE_STATUSES.includes(
        status as ExercicioImageQueueStatus,
      )
    ) {
      throw new BadRequestException('Status da fila de imagens invalido');
    }
    return status as ExercicioImageQueueStatus;
  }

  private normalizeQueueLimit(value?: string | number): number {
    if (value === undefined || value === null || value === '') return 100;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException('Limit da fila de imagens invalido');
    }
    return Math.min(parsed, 300);
  }

  private toImageQueueItem(
    exercicio: Exercicio,
  ): ExercicioImageQueueItem | null {
    const primaryMedia = this.findPrimaryMedia(exercicio);
    const filaStatus = this.resolveImageQueueStatus(exercicio, primaryMedia);
    if (!filaStatus) return null;

    return {
      id: exercicio.id,
      nome: exercicio.nome,
      slug: exercicio.slug,
      regiaoCorporal: exercicio.regiaoCorporal,
      categoria: exercicio.categoria,
      nivel: exercicio.nivel,
      exercicioStatus: exercicio.status,
      imagemKey: exercicio.imagemKey,
      mediaReviewStatus: primaryMedia?.revisaoClinicaStatus ?? null,
      filaStatus,
      prioridade: this.getImageQueuePriority(filaStatus),
      tags: exercicio.tags || [],
      translations: exercicio.translations || {},
    };
  }

  private findPrimaryMedia(exercicio: Exercicio): ExercicioMidia | null {
    if (!exercicio.imagemKey) return null;
    return (
      (exercicio.midias || []).find(
        (midia) => midia.ativo && midia.assetKey === exercicio.imagemKey,
      ) ?? null
    );
  }

  private resolveImageQueueStatus(
    exercicio: Exercicio,
    primaryMedia: ExercicioMidia | null,
  ): ExercicioImageQueueStatus | null {
    if (!exercicio.imagemKey) return 'SEM_IMAGEM';
    if (!primaryMedia) return 'SEM_MIDIA_PRINCIPAL';

    switch (primaryMedia.revisaoClinicaStatus) {
      case ExercicioMidiaRevisaoClinicaStatus.PENDENTE:
        return 'IMAGEM_PENDENTE_REVISAO';
      case ExercicioMidiaRevisaoClinicaStatus.REGENERAR_IMAGEM:
        return 'REGENERAR_IMAGEM';
      case ExercicioMidiaRevisaoClinicaStatus.AJUSTAR_TEXTO:
        return 'AJUSTAR_TEXTO';
      case ExercicioMidiaRevisaoClinicaStatus.REMOVER_DO_CATALOGO:
        return 'REMOVER_DO_CATALOGO';
      case ExercicioMidiaRevisaoClinicaStatus.APROVADA:
        return null;
    }
    return null;
  }

  private getImageQueuePriority(status: ExercicioImageQueueStatus): number {
    const priorities: Record<ExercicioImageQueueStatus, number> = {
      SEM_IMAGEM: 100,
      REGENERAR_IMAGEM: 90,
      SEM_MIDIA_PRINCIPAL: 85,
      IMAGEM_PENDENTE_REVISAO: 70,
      AJUSTAR_TEXTO: 60,
      REMOVER_DO_CATALOGO: 20,
    };
    return priorities[status];
  }

  private createImageQueueSummary(
    items: ExercicioImageQueueItem[],
  ): Record<ExercicioImageQueueStatus, number> {
    const summary = EXERCISE_IMAGE_QUEUE_STATUSES.reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {} as Record<ExercicioImageQueueStatus, number>,
    );
    for (const item of items) {
      summary[item.filaStatus] += 1;
    }
    return summary;
  }

  private buildImageProductionBrief(
    exercicio: Exercicio,
    queueItem: ExercicioImageQueueItem,
  ): ExercicioImageProductionBrief {
    const slug = this.toSlug(exercicio.slug || exercicio.nome);
    const imageKeySuggestion = this.toImageKeySuggestion(
      exercicio.imagemKey || slug,
    );
    const assetFileNameSuggestion = `${slug}.jpg`;
    const assetPathSuggestion = `exercise-images/exercises/${slug}/full.jpg`;
    const tags = (exercicio.tags || []).join(', ') || 'sem tags';
    const description = exercicio.descricao
      ? `Descrição: ${exercicio.descricao}.`
      : '';
    const cuidados = exercicio.cuidados
      ? `Cuidados: ${exercicio.cuidados}.`
      : '';
    const contraindicacoes = exercicio.contraindicacoes
      ? `Contraindicações: ${exercicio.contraindicacoes}.`
      : '';
    const tituloPaciente = exercicio.nome;
    const descricaoPaciente = this.compactText(exercicio.instrucoesPadrao, 500);
    const orientacaoProfissional = this.compactText(
      [`Objetivo: ${exercicio.objetivo}.`, cuidados, contraindicacoes].join(
        ' ',
      ),
      800,
    );
    const accessibilityLabel = this.compactText(
      `Ilustração do exercício ${exercicio.nome}, região ${exercicio.regiaoCorporal}, categoria ${exercicio.categoria}, nível ${exercicio.nivel}.`,
      300,
    );
    const objetivoImagem = [
      `Representar o exercício "${exercicio.nome}" de forma clinicamente clara para prescrição fisioterapêutica.`,
      `Região ${exercicio.regiaoCorporal}, categoria ${exercicio.categoria}, nível ${exercicio.nivel}.`,
    ].join(' ');
    const promptBase = [
      "Ilustração fisioterapêutica própria Synap, alta nitidez, proporção quadrada 1024x1024, sem texto embutido e sem marca d'água.",
      ...EXERCISE_IMAGE_VISUAL_STANDARD,
      'Usar enquadramento 3/4 quando ajudar a entender apoios e trajetória, mantendo proporções naturais, articulações plausíveis e leitura clara em miniatura.',
      `Exercício: ${exercicio.nome}. Objetivo clínico: ${exercicio.objetivo}. ${description}`,
      `Instruções do movimento: ${exercicio.instrucoesPadrao}. ${cuidados} ${contraindicacoes}`,
      `Tags de contexto: ${tags}.`,
    ]
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    const negativePrompt = EXERCISE_IMAGE_NEGATIVE_PROMPT.join(', ');
    const enquadramento = [
      'Mostrar corpo inteiro ou recorte suficiente para entender todos os apoios.',
      'Preferir vista 3/4 para movimentos com alternância de membros ou apoios complexos.',
      'Quando o exercício tiver fase inicial e final, mostrar as duas fases no mesmo quadro sem confundir a direção.',
      'Manter o paciente centralizado, com respiro lateral para setas e sem cortar extremidades importantes.',
    ];
    const identidadeVisual = [
      ...EXERCISE_IMAGE_VISUAL_STANDARD,
      'Qualidade final mínima de 1024x1024 antes de converter para JPG otimizado.',
    ];
    const criteriosClinicos = [
      'A postura precisa ser biomecanicamente possível e coerente com o nome do exercício.',
      'Apoios no solo, cadeira, parede, bastão, faixa ou bola precisam estar claros quando forem parte da execução.',
      'Em movimentos alternados, confirmar contralateralidade correta entre braço e perna.',
      'Não representar dor, compensações exageradas ou amplitude maior do que a descrita.',
      'A seta deve indicar movimento, não carga nem direção anatômica ambígua.',
    ];
    const checklistRevisao = [
      'Movimento, posição inicial e posição final batem com objetivo e instruções.',
      'Membros apoiados e membros em movimento estão corretos.',
      'Músculos destacados ajudam a entender a prescrição sem poluir a imagem.',
      'Imagem continua legível em miniatura e no card do paciente.',
      'Figura segue o padrão de adulto neutro, sem identidade facial forte e sem aparência de pessoa real identificável.',
      'Figura usa roupa esportiva justa cinza-claro/off-white, sem logo, sem roupa escura e sem tórax exposto.',
      "Não há texto, logo externo, marca d'água ou elemento com direito de terceiros.",
      `Rejeitar se houver: ${EXERCISE_IMAGE_VISUAL_REJECTION_CRITERIA.join('; ')}.`,
    ];
    const implementationChecklist = [
      `Publicar o JPG full em ${assetPathSuggestion}.`,
      `Publicar o thumbnail otimizado em exercise-images/exercises/${slug}/thumb.jpg.`,
      `Registrar a mídia via PATCH /exercicios/{id}/midia-principal-storage com storagePath, thumbnailUrl, imageUrl, mimeType, width, height e bytes.`,
      `Atualizar seed/migration do backend para usar imagemKey "${imageKeySuggestion}" quando o exercício virar catálogo oficial.`,
      'Manter asset local apenas como fallback temporário para imagens já embarcadas no app.',
      'Rodar validação crítica do mobile e testes focados do backend antes de aprovar clinicamente.',
    ];

    return {
      exercicio: queueItem,
      imageKeySuggestion,
      assetFileNameSuggestion,
      assetPathSuggestion,
      tituloPaciente,
      descricaoPaciente,
      orientacaoProfissional,
      accessibilityLabel,
      productionMarkdown: this.buildImageProductionMarkdown({
        queueItem,
        imageKeySuggestion,
        assetFileNameSuggestion,
        assetPathSuggestion,
        tituloPaciente,
        descricaoPaciente,
        orientacaoProfissional,
        accessibilityLabel,
        objetivoImagem,
        promptBase,
        negativePrompt,
        enquadramento,
        identidadeVisual,
        criteriosClinicos,
        checklistRevisao,
        implementationChecklist,
      }),
      objetivoImagem,
      promptBase,
      negativePrompt,
      enquadramento,
      identidadeVisual,
      criteriosClinicos,
      checklistRevisao,
      implementationChecklist,
    };
  }

  private buildImageProductionMarkdown(input: {
    queueItem: ExercicioImageQueueItem;
    imageKeySuggestion: string;
    assetFileNameSuggestion: string;
    assetPathSuggestion: string;
    tituloPaciente: string;
    descricaoPaciente: string;
    orientacaoProfissional: string;
    accessibilityLabel: string;
    objetivoImagem: string;
    promptBase: string;
    negativePrompt: string;
    enquadramento: string[];
    identidadeVisual: string[];
    criteriosClinicos: string[];
    checklistRevisao: string[];
    implementationChecklist: string[];
  }): string {
    const list = (items: string[]) =>
      items.map((item) => `- ${item}`).join('\n');
    return [
      `# ${input.queueItem.nome}`,
      '',
      `- Status da fila: ${input.queueItem.filaStatus}`,
      `- Região: ${input.queueItem.regiaoCorporal}`,
      `- Categoria: ${input.queueItem.categoria}`,
      `- Nível: ${input.queueItem.nivel}`,
      `- Chave sugerida: ${input.imageKeySuggestion}`,
      `- Arquivo sugerido: ${input.assetFileNameSuggestion}`,
      `- Caminho do asset: ${input.assetPathSuggestion}`,
      '',
      '## Paciente',
      `Título: ${input.tituloPaciente}`,
      `Texto: ${input.descricaoPaciente}`,
      '',
      '## Profissional',
      input.orientacaoProfissional,
      '',
      '## Acessibilidade',
      input.accessibilityLabel,
      '',
      '## Objetivo visual',
      input.objetivoImagem,
      '',
      '## Prompt base',
      input.promptBase,
      '',
      '## Prompt negativo',
      input.negativePrompt,
      '',
      '## Enquadramento',
      list(input.enquadramento),
      '',
      '## Identidade visual',
      list(input.identidadeVisual),
      '',
      '## Critérios clínicos',
      list(input.criteriosClinicos),
      '',
      '## Checklist de revisão',
      list(input.checklistRevisao),
      '',
      '## Checklist técnico',
      list(input.implementationChecklist),
    ].join('\n');
  }

  private buildImageProductionBatchMarkdown(
    items: ExercicioImageProductionBrief[],
    appliedFilters: ExercicioImageQueueAppliedFilters,
    total: number,
  ): string {
    if (!items.length) {
      return [
        '# Pacote de produção de imagens',
        '',
        this.formatImageQueueAppliedFilters(appliedFilters, total, 0),
        '',
        'Nenhum brief encontrado para o filtro atual.',
      ].join('\n');
    }
    return [
      '# Pacote de produção de imagens',
      '',
      this.formatImageQueueAppliedFilters(appliedFilters, total, items.length),
      '',
      ...items.flatMap((item, index) => [
        `---`,
        '',
        `## ${index + 1}. ${item.exercicio.nome}`,
        '',
        item.productionMarkdown,
      ]),
    ].join('\n');
  }

  private formatImageQueueAppliedFilters(
    appliedFilters: ExercicioImageQueueAppliedFilters,
    total: number,
    loaded: number,
  ): string {
    const filters = [
      `- Itens carregados: ${loaded}`,
      `- Total no filtro: ${total}`,
      `- Limite: ${appliedFilters.limit}`,
      `- Busca: ${appliedFilters.q || 'todas'}`,
      `- Status da fila: ${appliedFilters.filaStatus || 'TODOS'}`,
      `- Região: ${appliedFilters.regiaoCorporal || 'todas'}`,
      `- Categoria: ${appliedFilters.categoria || 'todas'}`,
      `- Nível: ${appliedFilters.nivel || 'todos'}`,
      `- Tag: ${appliedFilters.tag || 'todas'}`,
    ];
    return ['## Filtros aplicados', ...filters].join('\n');
  }

  private compactText(value: string, maxLength: number): string {
    const text = String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
  }

  private toImageKeySuggestion(value: string): string {
    const normalized = this.normalizeForMatch(value)
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase()
      .slice(0, 120);
    if (!normalized) {
      throw new BadRequestException('Chave de imagem invalida');
    }
    return normalized;
  }

  private scoreSuggestionCandidate(
    exercicio: Exercicio,
    context: string,
    imagemTipo: string,
  ): number {
    let score = 0;
    if (imagemTipo && exercicio.imagemKey === imagemTipo) score += 40;

    const fields = [
      exercicio.nome,
      exercicio.slug,
      exercicio.regiaoCorporal,
      exercicio.categoria,
      exercicio.nivel,
      exercicio.objetivo,
      exercicio.descricao,
      exercicio.instrucoesPadrao,
      JSON.stringify(exercicio.translations || {}),
      ...(exercicio.tags || []),
    ];

    for (const token of this.extractMatchTokens(fields.join(' '))) {
      if (context.includes(token)) score += token.length >= 8 ? 5 : 3;
    }

    for (const tag of exercicio.tags || []) {
      const normalizedTag = this.normalizeForMatch(tag).replace(/_/g, ' ');
      if (normalizedTag && context.includes(normalizedTag)) score += 8;
    }

    return score;
  }

  private extractMatchTokens(value: string): string[] {
    return Array.from(
      new Set(
        this.normalizeForMatch(value)
          .split(/[^a-z0-9]+/g)
          .filter((token) => token.length >= 4),
      ),
    );
  }

  private normalizeForMatch(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
