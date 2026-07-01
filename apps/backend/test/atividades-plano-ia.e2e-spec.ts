import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AtividadesController } from '../src/modules/atividades/atividades.controller';
import { AtividadesService } from '../src/modules/atividades/atividades.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';

const PACIENTE_ID = '11111111-1111-4111-8111-111111111111';
const EXERCICIO_ID = '22222222-2222-4222-8222-222222222222';

const planoResult = {
  itens: [
    {
      exercicioId: EXERCICIO_ID,
      exercicioNome: 'Gato-camelo',
      regiaoCorporal: 'LOMBAR',
      categoria: 'MOBILIDADE',
      nivel: 'INICIANTE',
      ordem: 1,
      series: 2,
      repeticoes: 10,
      tempoSegundos: null,
      frequenciaSemanal: 6,
      justificativa: 'Mobilidade lombar.',
      progressao: 'Progredir sem piora em 24h.',
      imagemUrl: 'https://cdn/thumb.png',
      imagemTipo: 'MOBILIDADE_LOMBAR_GATO_CAMELO',
      score: 9,
    },
  ],
  regioesAlvo: ['LOMBAR'],
  observacaoClinica: 'Plano com 1 exercicio focado em lombar.',
  redFlags: [],
  bloqueadoPorRedFlag: false,
  source: 'rules' as const,
  referencias: ['Kisner C, Colby LA, Borstad J.'],
};

describe('Atividades plano-ia (e2e)', () => {
  let app: INestApplication<App>;
  const recomendarPlanoIa = jest.fn();
  const aprovarPlanoIa = jest.fn();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AtividadesController],
      providers: [
        {
          provide: AtividadesService,
          useValue: { recomendarPlanoIa, aprovarPlanoIa },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: {
          switchToHttp: () => { getRequest: () => { user: unknown } };
        }) => {
          ctx.switchToHttp().getRequest().user = { id: 'user-1' };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/atividades/plano-ia', () => {
    it('gera o plano e repassa o usuario autenticado', async () => {
      recomendarPlanoIa.mockResolvedValue(planoResult);

      const res = await request(app.getHttpServer())
        .post('/api/atividades/plano-ia')
        .send({ pacienteId: PACIENTE_ID, maxExercicios: 4 })
        .expect(201);

      expect(res.body.itens).toHaveLength(1);
      expect(res.body.itens[0].imagemUrl).toBe('https://cdn/thumb.png');
      expect(res.body.source).toBe('rules');
      expect(recomendarPlanoIa).toHaveBeenCalledWith(
        expect.objectContaining({ pacienteId: PACIENTE_ID, maxExercicios: 4 }),
        'user-1',
      );
    });

    it('rejeita pacienteId ausente (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/atividades/plano-ia')
        .send({ maxExercicios: 4 })
        .expect(400);
      expect(recomendarPlanoIa).not.toHaveBeenCalled();
    });

    it('rejeita pacienteId nao-UUID (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/atividades/plano-ia')
        .send({ pacienteId: 'nao-e-uuid' })
        .expect(400);
    });

    it('rejeita maxExercicios acima do teto (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/atividades/plano-ia')
        .send({ pacienteId: PACIENTE_ID, maxExercicios: 99 })
        .expect(400);
    });

    it('rejeita campo desconhecido (400 - whitelist)', async () => {
      await request(app.getHttpServer())
        .post('/api/atividades/plano-ia')
        .send({ pacienteId: PACIENTE_ID, campoInvalido: 'x' })
        .expect(400);
    });
  });

  describe('POST /api/atividades/plano-ia/aprovar', () => {
    it('aprova o plano revisado pelo fisioterapeuta', async () => {
      aprovarPlanoIa.mockResolvedValue([{ id: 'atividade-1' }]);

      const res = await request(app.getHttpServer())
        .post('/api/atividades/plano-ia/aprovar')
        .send({
          pacienteId: PACIENTE_ID,
          itens: [
            {
              exercicioId: EXERCICIO_ID,
              series: 3,
              repeticoes: 12,
              diaPrescricao: 2,
            },
          ],
        })
        .expect(201);

      expect(res.body).toHaveLength(1);
      expect(aprovarPlanoIa).toHaveBeenCalledWith(
        expect.objectContaining({ pacienteId: PACIENTE_ID }),
        'user-1',
      );
    });

    it('rejeita lista de itens vazia (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/atividades/plano-ia/aprovar')
        .send({ pacienteId: PACIENTE_ID, itens: [] })
        .expect(400);
      expect(aprovarPlanoIa).not.toHaveBeenCalled();
    });

    it('rejeita item sem exercicioId (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/atividades/plano-ia/aprovar')
        .send({ pacienteId: PACIENTE_ID, itens: [{ series: 3 }] })
        .expect(400);
    });
  });
});
