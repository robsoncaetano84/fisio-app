import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAtividadeDto } from './create-atividade.dto';
import { CreateExercicioCatalogDto } from './create-exercicio-catalog.dto';
import {
  EXERCISE_IMAGE_TYPES,
  ExerciseImageType,
} from '../exercise-image-type.enum';
import { ExercicioStatus } from '../entities/exercicio.entity';
import { ExercicioMidiaRevisaoClinicaStatus } from '../entities/exercicio-midia.entity';
import { MASTER_EXERCISE_CATALOG } from '../exercise-catalog-master.seed';
import { PREVIEW_EXERCISE_CATALOG } from '../exercise-catalog-preview.seed';
import { INITIAL_EXERCISE_CATALOG } from '../exercicio-catalog.seed';
import { ExpandExerciseSpecificImageTypes1781100000000 } from '../../../migrations/1781100000000-ExpandExerciseSpecificImageTypes';
import { AddExerciseMediaClinicalReview1781200000000 } from '../../../migrations/1781200000000-AddExerciseMediaClinicalReview';
import { SeedPreviewExerciseCatalog1781300000000 } from '../../../migrations/1781300000000-SeedPreviewExerciseCatalog';
import { UpdateExercicioMidiaClinicalReviewDto } from './update-exercicio-midia-clinical-review.dto';

describe('exercise image DTO validation', () => {
  it('accepts only known local exercise image types for prescriptions', async () => {
    const dto = plainToInstance(CreateAtividadeDto, {
      pacienteId: '11111111-1111-4111-8111-111111111111',
      titulo: 'Ponte curta',
      instrucoesExecucao: '1. Execute com controle.',
      imagemTipo: ExerciseImageType.MOBILIDADE_LOMBAR,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);

    const invalidDto = plainToInstance(CreateAtividadeDto, {
      pacienteId: '11111111-1111-4111-8111-111111111111',
      titulo: 'Ponte curta',
      instrucoesExecucao: '1. Execute com controle.',
      imagemTipo: 'URL_EXTERNA',
    });

    const errors = await validate(invalidDto);
    expect(errors.some((error) => error.property === 'imagemTipo')).toBe(true);
  });

  it('accepts only known local exercise image keys for catalog records', async () => {
    const dto = plainToInstance(CreateExercicioCatalogDto, {
      nome: 'Exercicio novo',
      regiaoCorporal: 'LOMBAR',
      categoria: 'MOBILIDADE',
      nivel: 'INICIANTE',
      objetivo: 'Melhorar mobilidade.',
      instrucoesPadrao: '1. Execute com controle.',
      imagemKey: ExerciseImageType.MOBILIDADE_GERAL,
      tags: ['lombar'],
      status: ExercicioStatus.RASCUNHO,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);

    const invalidDto = plainToInstance(CreateExercicioCatalogDto, {
      nome: 'Exercicio novo',
      regiaoCorporal: 'LOMBAR',
      categoria: 'MOBILIDADE',
      nivel: 'INICIANTE',
      objetivo: 'Melhorar mobilidade.',
      instrucoesPadrao: '1. Execute com controle.',
      imagemKey: 'IMAGEM_DESCONHECIDA',
    });

    const errors = await validate(invalidDto);
    expect(errors.some((error) => error.property === 'imagemKey')).toBe(true);
  });

  it('accepts null image keys for draft catalog records without image', async () => {
    const dto = plainToInstance(CreateExercicioCatalogDto, {
      nome: 'Exercicio sem imagem',
      regiaoCorporal: 'LOMBAR',
      categoria: 'MOBILIDADE',
      nivel: 'INICIANTE',
      objetivo: 'Preparar revisao futura.',
      instrucoesPadrao: '1. Revisar clinicamente antes de prescrever.',
      imagemKey: null,
      status: ExercicioStatus.RASCUNHO,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('requires non-empty catalog fields before admin creation', async () => {
    const dto = plainToInstance(CreateExercicioCatalogDto, {
      nome: '',
      regiaoCorporal: 'LOMBAR',
      categoria: 'MOBILIDADE',
      nivel: 'INICIANTE',
      objetivo: 'Melhorar mobilidade.',
      instrucoesPadrao: '1. Execute com controle.',
      imagemKey: ExerciseImageType.MOBILIDADE_GERAL,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'nome')).toBe(true);
  });

  it('keeps the base database image constraints aligned with the base seed', () => {
    const migration = new ExpandExerciseSpecificImageTypes1781100000000();
    const baseImageTypes = new Set(
      INITIAL_EXERCISE_CATALOG.map((item) => item.imagemKey),
    );

    expect((migration as any).specificImageTypes).toEqual(
      expect.arrayContaining([...baseImageTypes]),
    );
  });

  it('keeps the final database image constraints aligned with the backend enum', () => {
    const migration = new SeedPreviewExerciseCatalog1781300000000();

    expect([...(migration as any).allowedImageTypes].sort()).toEqual(
      [...EXERCISE_IMAGE_TYPES].sort(),
    );
  });

  it('uses only known image keys in the initial proprietary catalog', () => {
    const allowedTypes = new Set(EXERCISE_IMAGE_TYPES);

    expect(
      INITIAL_EXERCISE_CATALOG.every((item) =>
        allowedTypes.has(item.imagemKey),
      ),
    ).toBe(true);
  });

  it('keeps the expanded proprietary catalog exercises in the initial seed', () => {
    const slugs = INITIAL_EXERCISE_CATALOG.map((item) => item.slug);

    expect(slugs).toEqual(
      expect.arrayContaining([
        'mobilidade-toracica-rotacao-sentada',
        'retracao-escapular-sentada',
        'isometria-rotacao-externa-ombro',
        'extensao-joelho-sentado',
        'sentar-levantar-controlado',
        'alongamento-flexores-quadril-meio-ajoelhado',
        'marcha-estacionaria-com-apoio',
        'mobilidade-punho-flexao-extensao',
        'alongamento-cervical-lateral-assistido',
        'deslizamento-neural-mediano',
      ]),
    );
    expect(slugs).toHaveLength(18);
  });

  it('keeps preview expansion exercises as drafts pending clinical review', () => {
    const allowedTypes = new Set(EXERCISE_IMAGE_TYPES);
    const slugs = PREVIEW_EXERCISE_CATALOG.map((item) => item.slug);

    expect(PREVIEW_EXERCISE_CATALOG).toHaveLength(70);
    expect(new Set(slugs).size).toBe(PREVIEW_EXERCISE_CATALOG.length);
    expect(
      PREVIEW_EXERCISE_CATALOG.every(
        (item) =>
          item.status === ExercicioStatus.RASCUNHO &&
          allowedTypes.has(item.imagemKey),
      ),
    ).toBe(true);
  });

  it('keeps the master catalog as draft exercises with optional image keys', () => {
    const allowedTypes = new Set(EXERCISE_IMAGE_TYPES);
    const slugs = MASTER_EXERCISE_CATALOG.map((item) => item.slug);
    const allSlugs = [
      ...INITIAL_EXERCISE_CATALOG.map((item) => item.slug),
      ...PREVIEW_EXERCISE_CATALOG.map((item) => item.slug),
      ...slugs,
    ];

    expect(MASTER_EXERCISE_CATALOG).toHaveLength(212);
    expect(new Set(slugs).size).toBe(MASTER_EXERCISE_CATALOG.length);
    expect(new Set(allSlugs).size).toBe(allSlugs.length);
    expect(allSlugs).toHaveLength(300);
    expect(
      MASTER_EXERCISE_CATALOG.every(
        (item) =>
          item.status === ExercicioStatus.RASCUNHO &&
          (item.imagemKey === null || allowedTypes.has(item.imagemKey)),
      ),
    ).toBe(true);
  });

  it('uses specific image keys for each seeded proprietary exercise', () => {
    const imageKeys = INITIAL_EXERCISE_CATALOG.map((item) => item.imagemKey);

    expect(imageKeys).toEqual(
      expect.arrayContaining([
        ExerciseImageType.MOBILIDADE_LOMBAR_GATO_CAMELO,
        ExerciseImageType.PONTE_CURTA,
        ExerciseImageType.CONTROLE_CERVICAL_PROFUNDO,
        ExerciseImageType.ELEVACAO_ASSISTIDA_OMBRO,
        ExerciseImageType.AGACHAMENTO_PARCIAL_ASSISTIDO,
        ExerciseImageType.ABDUCAO_QUADRIL_DECUBITO_LATERAL,
        ExerciseImageType.EQUILIBRIO_BIPODAL_TRANSFERENCIA_PESO,
        ExerciseImageType.PREENSAO_MANUAL_BOLA_MACIA,
        ExerciseImageType.MOBILIDADE_TORACICA_ROTACAO_SENTADA,
        ExerciseImageType.RETRACAO_ESCAPULAR_SENTADA,
        ExerciseImageType.ISOMETRIA_ROTACAO_EXTERNA_OMBRO,
        ExerciseImageType.EXTENSAO_JOELHO_SENTADO,
        ExerciseImageType.SENTAR_LEVANTAR_CONTROLADO,
        ExerciseImageType.ALONGAMENTO_FLEXORES_QUADRIL_MEIO_AJOELHADO,
        ExerciseImageType.MARCHA_ESTACIONARIA_APOIO,
        ExerciseImageType.MOBILIDADE_PUNHO_FLEXAO_EXTENSAO,
        ExerciseImageType.ALONGAMENTO_CERVICAL_LATERAL_ASSISTIDO,
        ExerciseImageType.DESLIZAMENTO_NEURAL_MEDIANO,
      ]),
    );
    expect(new Set(imageKeys).size).toBe(INITIAL_EXERCISE_CATALOG.length);
  });

  it('accepts only known clinical review status values for exercise media', async () => {
    const dto = plainToInstance(UpdateExercicioMidiaClinicalReviewDto, {
      status: ExercicioMidiaRevisaoClinicaStatus.APROVADA,
      observacao: 'Imagem clara para uso.',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);

    const invalidDto = plainToInstance(UpdateExercicioMidiaClinicalReviewDto, {
      status: 'APROVACAO_LIVRE',
    });

    const errors = await validate(invalidDto);
    expect(errors.some((error) => error.property === 'status')).toBe(true);
  });

  it('keeps database clinical review constraints aligned with the backend enum', () => {
    const migration = new AddExerciseMediaClinicalReview1781200000000();

    expect((migration as any).statuses.sort()).toEqual(
      Object.values(ExercicioMidiaRevisaoClinicaStatus).sort(),
    );
  });
});
