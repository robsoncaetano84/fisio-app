import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Not, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateExercicioCatalogDto } from './dto/create-exercicio-catalog.dto';
import { UpdateExercicioMidiaClinicalReviewDto } from './dto/update-exercicio-midia-clinical-review.dto';
import { UpdateExercicioCatalogDto } from './dto/update-exercicio-catalog.dto';
import { Exercicio, ExercicioStatus } from './entities/exercicio.entity';
import {
  ExercicioMidia,
  ExercicioMidiaRevisaoClinicaStatus,
} from './entities/exercicio-midia.entity';
import { PREVIEW_EXERCISE_CATALOG } from './exercise-catalog-preview.seed';
import { INITIAL_EXERCISE_CATALOG } from './exercicio-catalog.seed';

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
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV !== 'development') return;
    if (process.env.EXERCISE_CATALOG_AUTO_SEED === 'false') return;
    await this.seedInitialCatalogIfEmpty();
  }

  async findAll(filters: ExercicioCatalogFilters = {}): Promise<Exercicio[]> {
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
      throw new NotFoundException('Exercicio nao encontrado');
    }
    if (!exercicio.ativo || exercicio.status === ExercicioStatus.ARQUIVADO) {
      throw new BadRequestException(
        'Exercicio arquivado nao entra na producao de imagem',
      );
    }

    const queueItem = this.toImageQueueItem(exercicio);
    if (!queueItem) {
      throw new BadRequestException(
        'Exercicio nao esta na fila de producao de imagem',
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
    await this.assertApprovalRequirements(status, imagemKey);
    const exercicio = await this.exercicioRepository.save(
      this.exercicioRepository.create({
        nome,
        slug,
        regiaoCorporal: regiaoCorporal.toUpperCase(),
        categoria: categoria.toUpperCase(),
        nivel: nivel.toUpperCase(),
        objetivo,
        descricao: this.normalizeOptionalString(dto.descricao),
        instrucoesPadrao,
        cuidados: this.normalizeOptionalString(dto.cuidados),
        contraindicacoes: this.normalizeOptionalString(dto.contraindicacoes),
        imagemKey,
        tags: this.normalizeTags(dto.tags),
        status,
        versao: 1,
        revisadoPorUsuarioId: usuarioId,
        revisadoEm: new Date(),
        ativo: status !== ExercicioStatus.ARQUIVADO,
      }),
    );

    await this.syncPrimaryMedia(exercicio, usuarioId);
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

    return (await this.findOneForAdmin(exercicio.id)) ?? exercicio;
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

    for (const item of [
      ...INITIAL_EXERCISE_CATALOG,
      ...PREVIEW_EXERCISE_CATALOG,
    ]) {
      const exercicio = await this.exercicioRepository.save(
        this.exercicioRepository.create({
          ...item,
          revisadoEm: new Date(),
          ativo: item.status !== ExercicioStatus.ARQUIVADO,
          versao: 1,
        }),
      );

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
      existing.sourceType = 'PROPRIA';
      existing.sourceUrl = null;
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

  private normalizeOptionalString(value?: string | null): string | null {
    const trimmed = String(value || '').trim();
    return trimmed || null;
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
    const assetPathSuggestion = `apps/mobile/assets/exercises/${assetFileNameSuggestion}`;
    const tags = (exercicio.tags || []).join(', ') || 'sem tags';
    const description = exercicio.descricao
      ? `Descricao: ${exercicio.descricao}.`
      : '';
    const cuidados = exercicio.cuidados
      ? `Cuidados: ${exercicio.cuidados}.`
      : '';
    const contraindicacoes = exercicio.contraindicacoes
      ? `Contraindicacoes: ${exercicio.contraindicacoes}.`
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
      `Ilustracao do exercicio ${exercicio.nome}, regiao ${exercicio.regiaoCorporal}, categoria ${exercicio.categoria}, nivel ${exercicio.nivel}.`,
      300,
    );
    const objetivoImagem = [
      `Representar o exercicio "${exercicio.nome}" de forma clinicamente clara para prescricao fisioterapeutica.`,
      `Regiao ${exercicio.regiaoCorporal}, categoria ${exercicio.categoria}, nivel ${exercicio.nivel}.`,
    ].join(' ');
    const promptBase = [
      'Ilustracao fisioterapeutica propria Synap, estilo anatomico limpo, alta nitidez, fundo branco quente, sem texto embutido e sem marca d agua.',
      'Figura humana adulta com anatomia realista em tons de cinza, musculatura relevante destacada em verde Synap e setas discretas para indicar direcao do movimento.',
      'Usar enquadramento 3/4 quando ajudar a entender apoios e trajetoria, mantendo proporcoes naturais e articulacoes plausiveis.',
      `Exercicio: ${exercicio.nome}. Objetivo clinico: ${exercicio.objetivo}. ${description}`,
      `Instrucoes do movimento: ${exercicio.instrucoesPadrao}. ${cuidados} ${contraindicacoes}`,
      `Tags de contexto: ${tags}.`,
    ]
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    const negativePrompt =
      'logos externos, watermark, texto na imagem, pessoas reais identificaveis, foto stock, baixa resolucao, anatomia deformada, membros extras, lado errado, articulacoes impossiveis, apoio incoerente, amplitude agressiva, fundo poluido, objetos desnecessarios';
    const enquadramento = [
      'Mostrar corpo inteiro ou recorte suficiente para entender todos os apoios.',
      'Preferir vista 3/4 para movimentos com alternancia de membros ou apoios complexos.',
      'Quando o exercicio tiver fase inicial e final, mostrar as duas fases no mesmo quadro sem confundir a direcao.',
      'Manter o paciente centralizado, com respiro lateral para setas e sem cortar extremidades importantes.',
    ];
    const identidadeVisual = [
      'Base visual em cinza anatomico, fundo claro e limpo, com contraste suficiente em cards pequenos.',
      'Destaques musculares e setas em verde Synap, sem usar marca de terceiros.',
      'Sem logo, sem marca d agua e sem texto dentro da imagem; identificacao fica no app e no metadata.',
      'Qualidade final minima de 1024x1024 antes de converter para JPG otimizado.',
    ];
    const criteriosClinicos = [
      'A postura precisa ser biomecanicamente possivel e coerente com o nome do exercicio.',
      'Apoios no solo, cadeira, parede, bastao, faixa ou bola precisam estar claros quando forem parte da execucao.',
      'Em movimentos alternados, confirmar contralateralidade correta entre braco e perna.',
      'Nao representar dor, compensacoes exageradas ou amplitude maior do que a descrita.',
      'A seta deve indicar movimento, nao carga nem direcao anatomica ambigua.',
    ];
    const checklistRevisao = [
      'Movimento, posicao inicial e posicao final batem com objetivo e instrucoes.',
      'Membros apoiados e membros em movimento estao corretos.',
      'Musculos destacados ajudam a entender a prescricao sem poluir a imagem.',
      'Imagem continua legivel em miniatura e no card do paciente.',
      'Nao ha texto, logo externo, watermark ou elemento com direito de terceiros.',
    ];
    const implementationChecklist = [
      `Salvar o JPG final em ${assetPathSuggestion}.`,
      `Adicionar "${imageKeySuggestion}" ao tipo ExerciseImageType em apps/mobile/src/components/clinical/ExerciseVisual.tsx.`,
      'Adicionar label e hint clinico em EXERCISE_IMAGE_OPTIONS.',
      `Mapear ${imageKeySuggestion} em EXERCISE_IMAGE_ASSETS com require("../../../assets/exercises/${assetFileNameSuggestion}").`,
      `Atualizar seed/migration do backend para usar imagemKey "${imageKeySuggestion}" quando o exercicio virar catalogo oficial.`,
      'Rodar validacao critica do mobile e testes focados do backend antes de aprovar clinicamente.',
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
      `- Regiao: ${input.queueItem.regiaoCorporal}`,
      `- Categoria: ${input.queueItem.categoria}`,
      `- Nivel: ${input.queueItem.nivel}`,
      `- Chave sugerida: ${input.imageKeySuggestion}`,
      `- Arquivo sugerido: ${input.assetFileNameSuggestion}`,
      `- Caminho do asset: ${input.assetPathSuggestion}`,
      '',
      '## Paciente',
      `Titulo: ${input.tituloPaciente}`,
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
      '## Criterios clinicos',
      list(input.criteriosClinicos),
      '',
      '## Checklist de revisao',
      list(input.checklistRevisao),
      '',
      '## Checklist tecnico',
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
        '# Pacote de producao de imagens',
        '',
        this.formatImageQueueAppliedFilters(appliedFilters, total, 0),
        '',
        'Nenhum brief encontrado para o filtro atual.',
      ].join('\n');
    }
    return [
      '# Pacote de producao de imagens',
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
      `- Regiao: ${appliedFilters.regiaoCorporal || 'todas'}`,
      `- Categoria: ${appliedFilters.categoria || 'todas'}`,
      `- Nivel: ${appliedFilters.nivel || 'todos'}`,
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
