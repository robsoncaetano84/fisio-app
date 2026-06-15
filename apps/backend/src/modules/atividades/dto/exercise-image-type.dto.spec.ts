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
import { INITIAL_EXERCISE_CATALOG } from '../exercicio-catalog.seed';
import { NormalizeExerciseImageFields1780800000000 } from '../../../migrations/1780800000000-NormalizeExerciseImageFields';

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

  it('keeps database image constraints aligned with the backend enum', () => {
    const migration = new NormalizeExerciseImageFields1780800000000();

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
});
