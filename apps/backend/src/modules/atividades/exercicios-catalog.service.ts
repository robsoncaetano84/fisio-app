import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
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
      )
      .where('exercicio.ativo = :ativo', { ativo: true });

    if (!filters.includeDrafts) {
      qb.andWhere('exercicio.status = :status', {
        status: ExercicioStatus.APROVADO,
      });
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
}
