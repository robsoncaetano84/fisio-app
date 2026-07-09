// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// E XE RC IC IO S M ID IA U PL OA D.S PE C
// ==========================================
jest.mock('./exercicio-midia-storage', () => ({
  buildExercicioMidiaObjectKey: jest.fn().mockReturnValue('slug/key.png'),
  persistExercicioMidiaFile: jest.fn().mockResolvedValue({
    storagePath: 'supabase://exercicios/slug/key.png',
    imageUrl: 'https://sb/storage/v1/object/public/exercicios/slug/key.png',
  }),
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ExerciciosCatalogService } from './exercicios-catalog.service';
import { Exercicio } from './entities/exercicio.entity';
import {
  ExercicioMidia,
  ExercicioMidiaRevisaoClinicaStatus,
} from './entities/exercicio-midia.entity';

/**
 * Etapa-38 F3: upload de imagem do exercicio pelo backend. Valida formato/
 * tamanho e entra sempre como revisao clinica PENDENTE.
 */
describe('ExerciciosCatalogService.uploadPrimaryMedia (F3)', () => {
  function build(exercicio: unknown) {
    const exercicioRepo = {
      findOne: jest.fn().mockResolvedValue(exercicio),
      save: jest.fn(async (x) => x),
    } as unknown as Repository<Exercicio>;
    const midiaRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((x) => ({ ...x })),
      save: jest.fn(async (x) => x),
    } as unknown as Repository<ExercicioMidia>;

    const service = new ExerciciosCatalogService(exercicioRepo, midiaRepo);
    jest
      .spyOn(service as never, 'findOneForAdmin')
      .mockResolvedValue(exercicio as never);
    return { service, exercicioRepo, midiaRepo };
  }

  const file = (over: Record<string, unknown> = {}) => ({
    buffer: Buffer.from('imagem'),
    originalname: 'ponte.png',
    mimetype: 'image/png',
    size: 100,
    ...over,
  });

  afterEach(() => jest.clearAllMocks());

  it('sobe a imagem e grava a midia como PENDENTE com metadados de storage', async () => {
    const exercicio = { id: 'ex1', slug: 'ponte-curta', imagemKey: null };
    const { service, midiaRepo } = build(exercicio);

    await service.uploadPrimaryMedia('ex1', file() as never, 'admin1');

    const saved = (midiaRepo.save as jest.Mock).mock.calls[0][0];
    expect(saved.revisaoClinicaStatus).toBe(
      ExercicioMidiaRevisaoClinicaStatus.PENDENTE,
    );
    expect(saved.sourceType).toBe('UPLOAD');
    expect(saved.storagePath).toContain('supabase://');
    expect(saved.imageUrl).toContain('https://');
    expect(saved.mimeType).toBe('image/png');
  });

  it('recusa formato invalido (nao imagem)', async () => {
    const { service } = build({ id: 'ex1', slug: 's', imagemKey: null });
    await expect(
      service.uploadPrimaryMedia(
        'ex1',
        file({ mimetype: 'application/pdf' }) as never,
        'a',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recusa arquivo acima de 5MB', async () => {
    const { service } = build({ id: 'ex1', slug: 's', imagemKey: null });
    await expect(
      service.uploadPrimaryMedia(
        'ex1',
        file({ size: 6 * 1024 * 1024 }) as never,
        'a',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('404 quando o exercicio nao existe', async () => {
    const { service } = build(null);
    await expect(
      service.uploadPrimaryMedia('x', file() as never, 'a'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
