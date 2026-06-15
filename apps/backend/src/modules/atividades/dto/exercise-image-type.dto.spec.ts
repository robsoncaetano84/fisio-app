import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAtividadeDto } from './create-atividade.dto';
import { CreateExercicioCatalogDto } from './create-exercicio-catalog.dto';
import { ExerciseImageType } from '../exercise-image-type.enum';
import { ExercicioStatus } from '../entities/exercicio.entity';

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
});
