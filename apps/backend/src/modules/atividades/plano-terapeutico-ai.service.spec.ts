import { PlanoTerapeuticoAiService } from './plano-terapeutico-ai.service';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Exercicio } from './entities/exercicio.entity';

const paciente = { id: 'pac-1', nomeCompleto: 'Teste' } as unknown as Paciente;

function makeExercicio(overrides: Partial<Exercicio>): Exercicio {
  return {
    id: overrides.id ?? 'ex-' + Math.random().toString(36).slice(2, 8),
    nome: overrides.nome ?? 'Exercicio',
    slug: overrides.slug ?? 'exercicio',
    regiaoCorporal: overrides.regiaoCorporal ?? 'MOBILIDADE_GERAL',
    categoria: overrides.categoria ?? 'MOBILIDADE',
    nivel: overrides.nivel ?? 'INICIANTE',
    objetivo: overrides.objetivo ?? 'Melhorar mobilidade da regiao alvo',
    descricao: overrides.descricao ?? null,
    instrucoesPadrao: overrides.instrucoesPadrao ?? 'Execute com controle',
    cuidados: overrides.cuidados ?? null,
    contraindicacoes: overrides.contraindicacoes ?? null,
    imagemKey: overrides.imagemKey ?? 'IMG_KEY',
    tags: overrides.tags ?? [],
    translations: overrides.translations ?? {},
    midias: overrides.midias ?? [
      {
        ativo: true,
        assetKey: overrides.imagemKey ?? 'IMG_KEY',
        thumbnailUrl: 'https://cdn/thumb.png',
        imageUrl: 'https://cdn/img.png',
        sourceUrl: null,
      } as never,
    ],
  } as unknown as Exercicio;
}

function makeAnamnese(overrides: Partial<Anamnese>): Anamnese {
  return {
    intensidadeDor: 4,
    descricaoSintomas: '',
    limitacoesFuncionais: '',
    atividadesQuePioram: '',
    fatoresPiora: '',
    metaPrincipalPaciente: '',
    dorNoturna: false,
    ...overrides,
  } as unknown as Anamnese;
}

describe('PlanoTerapeuticoAiService', () => {
  let service: PlanoTerapeuticoAiService;

  beforeEach(() => {
    service = new PlanoTerapeuticoAiService();
  });

  it('infere regioes-alvo a partir da anamnese', () => {
    const anamnese = makeAnamnese({
      descricaoSintomas: 'Dor no ombro direito ao elevar o braco',
    });
    expect(service.inferirRegioes(anamnese, null)).toContain('OMBRO');
  });

  it('recomenda exercicios do catalogo com imagem e respeita o limite', async () => {
    const anamnese = makeAnamnese({
      descricaoSintomas: 'lombalgia com dor lombar ao sentar',
      metaPrincipalPaciente: 'voltar a caminhar sem dor lombar',
    });
    const candidatos = [
      makeExercicio({
        id: 'a',
        nome: 'Gato-camelo',
        regiaoCorporal: 'LOMBAR',
        objetivo: 'mobilidade lombar',
      }),
      makeExercicio({
        id: 'b',
        nome: 'Ponte curta',
        regiaoCorporal: 'LOMBAR_QUADRIL',
        categoria: 'CONTROLE_MOTOR',
        objetivo: 'controle lombar pelvico',
      }),
      makeExercicio({
        id: 'c',
        nome: 'Dead bug',
        regiaoCorporal: 'TORACICA_LOMBAR_CORE',
        categoria: 'CONTROLE_MOTOR',
        objetivo: 'controle lombar do core',
      }),
    ];

    const resultado = await service.recomendar(
      paciente,
      anamnese,
      null,
      candidatos,
      {
        maxExercicios: 2,
      },
    );

    expect(resultado.bloqueadoPorRedFlag).toBe(false);
    expect(resultado.source).toBe('rules');
    expect(resultado.itens).toHaveLength(2);
    expect(resultado.itens[0].imagemUrl).toBe('https://cdn/thumb.png');
    expect(resultado.itens[0].exercicioId).toBeDefined();
    expect(resultado.itens[0].series).toBeGreaterThan(0);
    expect(resultado.itens[0].frequenciaSemanal).toBeGreaterThan(0);
  });

  it('bloqueia a prescricao quando ha red flag', async () => {
    const anamnese = makeAnamnese({
      descricaoSintomas:
        'perda de forca progressiva na perna e incontinencia urinaria',
    });
    const candidatos = [makeExercicio({ id: 'a', regiaoCorporal: 'LOMBAR' })];

    const resultado = await service.recomendar(
      paciente,
      anamnese,
      null,
      candidatos,
    );

    expect(resultado.bloqueadoPorRedFlag).toBe(true);
    expect(resultado.itens).toHaveLength(0);
    expect(resultado.redFlags.length).toBeGreaterThan(0);
  });

  it('descarta exercicio cuja contraindicacao e reproduzida pelo quadro', async () => {
    const anamnese = makeAnamnese({
      descricaoSintomas: 'dor no joelho com agachamento profundo',
      atividadesQuePioram: 'agachamento profundo',
    });
    const candidatos = [
      makeExercicio({
        id: 'contra',
        nome: 'Agachamento profundo',
        regiaoCorporal: 'JOELHO',
        objetivo: 'fortalecer joelho no agachamento',
        contraindicacoes: 'agachamento profundo com dor anterior de joelho',
      }),
      makeExercicio({
        id: 'ok',
        nome: 'Isometria de quadriceps',
        regiaoCorporal: 'JOELHO',
        categoria: 'FORTALECIMENTO',
        objetivo: 'ativar quadriceps sem carga articular no joelho',
      }),
    ];

    const resultado = await service.recomendar(
      paciente,
      anamnese,
      null,
      candidatos,
    );

    const ids = resultado.itens.map((item) => item.exercicioId);
    expect(ids).not.toContain('contra');
    expect(ids).toContain('ok');
  });

  it('reduz a dose e prioriza descarga quando a dor e alta', async () => {
    const anamnese = makeAnamnese({
      intensidadeDor: 9,
      descricaoSintomas: 'dor lombar intensa',
    });
    const mobilidade = makeExercicio({
      id: 'm',
      regiaoCorporal: 'LOMBAR',
      categoria: 'MOBILIDADE',
      objetivo: 'mobilidade lombar',
    });
    const forca = makeExercicio({
      id: 'f',
      regiaoCorporal: 'LOMBAR',
      categoria: 'FORTALECIMENTO',
      objetivo: 'fortalecer lombar',
    });

    const resultado = await service.recomendar(paciente, anamnese, null, [
      forca,
      mobilidade,
    ]);

    expect(resultado.itens[0].exercicioId).toBe('m');
  });

  it('retorna plano vazio com observacao quando nao ha candidato compativel', async () => {
    const anamnese = makeAnamnese({ descricaoSintomas: 'dor no ombro' });
    const resultado = await service.recomendar(paciente, anamnese, null, []);

    expect(resultado.itens).toHaveLength(0);
    expect(resultado.bloqueadoPorRedFlag).toBe(false);
    expect(resultado.observacaoClinica).toContain('Nenhum exercicio');
  });
});
