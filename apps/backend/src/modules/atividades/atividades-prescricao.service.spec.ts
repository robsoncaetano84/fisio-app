// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// A TI VI DA DE S P RE SC RI CA O.S PE C
// ==========================================
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AtividadesService } from './atividades.service';
import { Atividade } from './entities/atividade.entity';
import { AtividadeCheckin } from './entities/atividade-checkin.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { ExerciciosCatalogService } from './exercicios-catalog.service';
import { CreateAtividadeDto } from './dto/create-atividade.dto';

/**
 * Etapa-38 F2b: prescrever a partir do catalogo deriva imagem/tipo/instrucoes
 * no servidor a partir do exercicio APROVADO; exercicio invalido e recusado.
 */
describe('AtividadesService.create — prescricao com exercicio (F2b)', () => {
  function build(exercicioAprovado: unknown) {
    const atividadeRepo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
    } as unknown as Repository<Atividade>;
    const pacienteRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'p1', usuarioId: 'u1' }),
    } as unknown as Repository<Paciente>;
    const catalog = {
      findApprovedById: jest.fn().mockResolvedValue(exercicioAprovado),
    } as unknown as ExerciciosCatalogService;

    const service = new AtividadesService(
      atividadeRepo,
      {} as unknown as Repository<AtividadeCheckin>,
      pacienteRepo,
      {} as unknown as NotificacoesService,
      catalog,
    );
    return { service, catalog };
  }

  const baseDto: CreateAtividadeDto = {
    pacienteId: 'p1',
    titulo: 'Exercicio prescrito',
  } as CreateAtividadeDto;

  it('deriva imagemTipo/instrucoes/imagemUrl do exercicio aprovado', async () => {
    const exercicio = {
      id: 'ex1',
      imagemKey: 'PONTE_CURTA',
      instrucoesPadrao: 'Deite e eleve o quadril.',
      midias: [
        {
          ativo: true,
          assetKey: 'PONTE_CURTA',
          thumbnailUrl: 'https://bucket/ponte-thumb.jpg',
          imageUrl: 'https://bucket/ponte.jpg',
        },
      ],
    };
    const { service } = build(exercicio);

    const result = await service.create(
      { ...baseDto, exercicioId: 'ex1' } as CreateAtividadeDto,
      'u1',
    );

    expect(result.exercicioId).toBe('ex1');
    expect(result.imagemTipo).toBe('PONTE_CURTA');
    expect(result.instrucoesExecucao).toBe('Deite e eleve o quadril.');
    expect(result.imagemUrl).toBe('https://bucket/ponte-thumb.jpg');
  });

  it('respeita override manual de instrucoes do profissional', async () => {
    const exercicio = {
      id: 'ex1',
      imagemKey: 'PONTE_CURTA',
      instrucoesPadrao: 'Padrao.',
      midias: [],
    };
    const { service } = build(exercicio);

    const result = await service.create(
      {
        ...baseDto,
        exercicioId: 'ex1',
        instrucoesExecucao: 'Faca 3 series de 10.',
      } as CreateAtividadeDto,
      'u1',
    );

    expect(result.instrucoesExecucao).toBe('Faca 3 series de 10.');
    expect(result.imagemUrl).toBeNull(); // sem midia aprovada
  });

  it('recusa exercicioId que nao existe / nao esta aprovado', async () => {
    const { service } = build(null);
    await expect(
      service.create(
        { ...baseDto, exercicioId: 'inexistente' } as CreateAtividadeDto,
        'u1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cria atividade de texto livre normalmente quando nao ha exercicioId', async () => {
    const { service, catalog } = build(null);
    const result = await service.create(baseDto, 'u1');
    expect(catalog.findApprovedById).not.toHaveBeenCalled();
    expect(result.exercicioId).toBeNull();
    expect(result.imagemUrl).toBeNull();
  });
});
