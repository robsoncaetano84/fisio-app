import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Not, Repository } from 'typeorm';
import { CreateExercicioCatalogDto } from './dto/create-exercicio-catalog.dto';
import { UpdateExercicioCatalogDto } from './dto/update-exercicio-catalog.dto';
import { Exercicio, ExercicioStatus } from './entities/exercicio.entity';
import { ExercicioMidia } from './entities/exercicio-midia.entity';
import { INITIAL_EXERCISE_CATALOG } from './exercicio-catalog.seed';

export type ExercicioCatalogFilters = {
  q?: string;
  regiaoCorporal?: string;
  categoria?: string;
  nivel?: string;
  tag?: string;
  includeDrafts?: boolean;
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
    const qb = this.exercicioRepository
      .createQueryBuilder('exercicio')
      .leftJoinAndSelect(
        'exercicio.midias',
        'midia',
        'midia.ativo = :midiaAtiva',
        { midiaAtiva: true },
      );

    if (filters.includeDrafts) {
      qb.where('1 = 1');
    } else {
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
            .orWhere('exercicio.objetivo ILIKE :q', { q })
            .orWhere('exercicio.descricao ILIKE :q', { q });
        }),
      );
    }

    return qb
      .orderBy('exercicio.regiaoCorporal', 'ASC')
      .addOrderBy('exercicio.nome', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<Exercicio | null> {
    return this.exercicioRepository
      .createQueryBuilder('exercicio')
      .leftJoinAndSelect(
        'exercicio.midias',
        'midia',
        'midia.ativo = :midiaAtiva',
        { midiaAtiva: true },
      )
      .where('exercicio.id = :id', { id })
      .andWhere('exercicio.ativo = :ativo', { ativo: true })
      .andWhere('exercicio.status = :status', {
        status: ExercicioStatus.APROVADO,
      })
      .getOne();
  }

  async findApprovedById(id: string): Promise<Exercicio | null> {
    return this.exercicioRepository.findOne({
      where: { id, ativo: true, status: ExercicioStatus.APROVADO },
    });
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
    const slug = await this.resolveUniqueSlug(dto.slug || dto.nome);
    const imagemKey = this.normalizeOptionalString(dto.imagemKey);
    const status = dto.status ?? ExercicioStatus.RASCUNHO;
    const exercicio = await this.exercicioRepository.save(
      this.exercicioRepository.create({
        nome: dto.nome.trim(),
        slug,
        regiaoCorporal: dto.regiaoCorporal.trim().toUpperCase(),
        categoria: dto.categoria.trim().toUpperCase(),
        nivel: dto.nivel.trim().toUpperCase(),
        objetivo: dto.objetivo.trim(),
        descricao: this.normalizeOptionalString(dto.descricao),
        instrucoesPadrao: dto.instrucoesPadrao.trim(),
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
      exercicio.nome = dto.nome.trim();
    }
    if (typeof dto.slug === 'string') {
      exercicio.slug = await this.resolveUniqueSlug(dto.slug, exercicio.id);
    }
    if (typeof dto.regiaoCorporal === 'string') {
      exercicio.regiaoCorporal = dto.regiaoCorporal.trim().toUpperCase();
    }
    if (typeof dto.categoria === 'string') {
      exercicio.categoria = dto.categoria.trim().toUpperCase();
    }
    if (typeof dto.nivel === 'string') {
      exercicio.nivel = dto.nivel.trim().toUpperCase();
    }
    if (typeof dto.objetivo === 'string') {
      exercicio.objetivo = dto.objetivo.trim();
    }
    if (typeof dto.descricao === 'string') {
      exercicio.descricao = this.normalizeOptionalString(dto.descricao);
    }
    if (typeof dto.instrucoesPadrao === 'string') {
      exercicio.instrucoesPadrao = dto.instrucoesPadrao.trim();
    }
    if (typeof dto.cuidados === 'string') {
      exercicio.cuidados = this.normalizeOptionalString(dto.cuidados);
    }
    if (typeof dto.contraindicacoes === 'string') {
      exercicio.contraindicacoes = this.normalizeOptionalString(
        dto.contraindicacoes,
      );
    }
    if (typeof dto.imagemKey === 'string') {
      exercicio.imagemKey = this.normalizeOptionalString(dto.imagemKey);
    }
    if (Array.isArray(dto.tags)) {
      exercicio.tags = this.normalizeTags(dto.tags);
    }
    if (dto.status) {
      exercicio.status = dto.status;
      exercicio.ativo = dto.status !== ExercicioStatus.ARQUIVADO;
    }

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

  async findBestMatchForSuggestion(
    input: ExercicioSuggestionMatchInput,
  ): Promise<Exercicio | null> {
    const candidates = await this.exercicioRepository.find({
      where: { ativo: true, status: ExercicioStatus.APROVADO },
      order: { regiaoCorporal: 'ASC', nome: 'ASC' },
    });
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

    for (const item of INITIAL_EXERCISE_CATALOG) {
      const exercicio = await this.exercicioRepository.save(
        this.exercicioRepository.create({
          ...item,
          revisadoEm: new Date(),
          ativo: true,
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
          ativo: true,
          versao: 1,
        }),
      );
    }
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
