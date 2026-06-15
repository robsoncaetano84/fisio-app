import { ExercicioStatus } from './entities/exercicio.entity';

export type ExercicioSeed = {
  nome: string;
  slug: string;
  regiaoCorporal: string;
  categoria: string;
  nivel: string;
  objetivo: string;
  descricao: string;
  instrucoesPadrao: string;
  cuidados: string;
  contraindicacoes: string;
  imagemKey: string;
  tags: string[];
  status: ExercicioStatus;
};

export const INITIAL_EXERCISE_CATALOG: ExercicioSeed[] = [
  {
    nome: 'Mobilidade lombar em gato-camelo',
    slug: 'mobilidade-lombar-gato-camelo',
    regiaoCorporal: 'LOMBAR',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo: 'Reduzir rigidez lombar e melhorar controle lombo-pelvico.',
    descricao:
      'Movimento suave alternando flexao e extensao da coluna em quatro apoios.',
    instrucoesPadrao:
      '1. Fique em quatro apoios, com maos abaixo dos ombros e joelhos abaixo do quadril.\n2. Arredonde lentamente a coluna e depois retorne levando o peito levemente para frente.\n3. Mantenha o movimento lento, sem prender a respiracao.\n4. Pare se houver dor irradiada, formigamento ou piora sustentada.',
    cuidados:
      'Evitar amplitudes forcadas. Priorizar conforto, respiracao e controle.',
    contraindicacoes:
      'Suspender em caso de dor neurologica progressiva, perda de forca ou tontura.',
    imagemKey: 'MOBILIDADE_LOMBAR',
    tags: ['lombar', 'mobilidade', 'controle_motor', 'dor_lombar'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Ponte curta',
    slug: 'ponte-curta',
    regiaoCorporal: 'LOMBAR_QUADRIL',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo: 'Ativar gluteos e cadeia posterior com baixa carga.',
    descricao:
      'Elevacao curta do quadril em decubito dorsal, mantendo controle do tronco.',
    instrucoesPadrao:
      '1. Deite de barriga para cima com joelhos dobrados e pes apoiados.\n2. Contraia levemente o abdome e eleve o quadril ate alinhar tronco e coxas.\n3. Desca devagar, mantendo joelhos alinhados.\n4. Interrompa se a dor lombar aumentar ou permanecer apos o exercicio.',
    cuidados:
      'Evitar hiperextensao lombar e empurrar com excesso pelo pescoco.',
    contraindicacoes:
      'Nao executar se houver dor intensa, piora neurologica ou orientacao profissional contraria.',
    imagemKey: 'MOBILIDADE_LOMBAR',
    tags: ['lombar', 'quadril', 'gluteos', 'fortalecimento'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Controle cervical profundo',
    slug: 'controle-cervical-profundo',
    regiaoCorporal: 'CERVICAL',
    categoria: 'CONTROLE_MOTOR',
    nivel: 'INICIANTE',
    objetivo: 'Melhorar controle cervical e reduzir sobrecarga postural.',
    descricao:
      'Movimento pequeno de recolher o queixo, mantendo coluna cervical alinhada.',
    instrucoesPadrao:
      '1. Sente ou deite com a cabeca apoiada e ombros relaxados.\n2. Recolha suavemente o queixo, como se fizesse um pequeno sim para tras.\n3. Segure por poucos segundos e relaxe.\n4. Nao force amplitude e pare se houver tontura, nausea ou dor irradiada.',
    cuidados: 'Movimento deve ser pequeno e sem compensar com ombros.',
    contraindicacoes:
      'Evitar em crise vestibular, tontura importante ou sintomas neurologicos novos.',
    imagemKey: 'CONTROLE_CERVICAL',
    tags: ['cervical', 'postura', 'controle_motor', 'pescoco'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Elevacao assistida de ombro',
    slug: 'elevacao-assistida-ombro',
    regiaoCorporal: 'OMBRO',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo: 'Manter mobilidade de ombro em amplitude toleravel.',
    descricao:
      'Elevacao do braco com apoio da outra mao ou bastao, respeitando dor.',
    instrucoesPadrao:
      '1. Segure o braco afetado com apoio da outra mao ou de um bastao.\n2. Eleve o braco lentamente ate uma amplitude confortavel.\n3. Retorne devagar, mantendo escapula controlada.\n4. Nao ultrapasse dor forte ou sensacao de travamento.',
    cuidados: 'Evitar compensar elevando o ombro em direcao a orelha.',
    contraindicacoes:
      'Evitar em luxacao recente, fratura nao liberada ou dor aguda intensa.',
    imagemKey: 'OMBRO_MANGUITO',
    tags: ['ombro', 'mobilidade', 'manguito', 'escapula'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Agachamento parcial assistido',
    slug: 'agachamento-parcial-assistido',
    regiaoCorporal: 'JOELHO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Treinar controle de joelho e quadril em cadeia cinetica fechada.',
    descricao:
      'Agachamento curto com apoio, mantendo joelhos alinhados e carga toleravel.',
    instrucoesPadrao:
      '1. Fique em pe com apoio seguro a frente.\n2. Flexione joelhos e quadris apenas ate uma amplitude confortavel.\n3. Mantenha joelhos apontando para a linha dos pes.\n4. Suba devagar e pare se houver dor forte ou instabilidade.',
    cuidados: 'Nao deixar joelho cair para dentro. Evitar velocidade alta.',
    contraindicacoes:
      'Evitar em dor aguda alta, bloqueio articular ou instabilidade importante.',
    imagemKey: 'JOELHO_AGACHAMENTO',
    tags: ['joelho', 'agachamento', 'quadriceps', 'controle_valgo'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Abducao de quadril em decubito lateral',
    slug: 'abducao-quadril-decubito-lateral',
    regiaoCorporal: 'QUADRIL',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo: 'Ativar gluteo medio e melhorar controle pelvico.',
    descricao: 'Elevacao lateral da perna com tronco alinhado e pelve estavel.',
    instrucoesPadrao:
      '1. Deite de lado com a perna de baixo flexionada para estabilidade.\n2. Eleve a perna de cima sem rodar o quadril para tras.\n3. Desca lentamente mantendo controle.\n4. Pare se houver dor lateral intensa ou compensacao lombar.',
    cuidados: 'Manter pe apontado para frente e pelve estavel.',
    contraindicacoes:
      'Evitar em dor aguda no quadril ou irritacao importante na regiao lateral.',
    imagemKey: 'QUADRIL_GLUTEOS',
    tags: ['quadril', 'gluteo_medio', 'pelve', 'fortalecimento'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Equilibrio bipodal com transferencia de peso',
    slug: 'equilibrio-bipodal-transferencia-peso',
    regiaoCorporal: 'TORNOZELO',
    categoria: 'PROPRIOCEPCAO',
    nivel: 'INICIANTE',
    objetivo: 'Melhorar controle de apoio e estabilidade distal.',
    descricao:
      'Transferencia lenta de peso entre os pes mantendo postura e apoio seguro.',
    instrucoesPadrao:
      '1. Fique em pe perto de uma parede ou bancada.\n2. Transfira o peso lentamente de um pe para o outro.\n3. Mantenha tronco alinhado e respire normalmente.\n4. Interrompa se houver instabilidade, dor forte ou medo de queda.',
    cuidados: 'Executar com apoio por perto e sem fechar os olhos no inicio.',
    contraindicacoes:
      'Evitar sem supervisao em alto risco de queda ou tontura importante.',
    imagemKey: 'TORNOZELO_EQUILIBRIO',
    tags: ['tornozelo', 'equilibrio', 'propriocepcao', 'apoio'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Preensao manual com bola macia',
    slug: 'preensao-manual-bola-macia',
    regiaoCorporal: 'PUNHO_MAO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo: 'Melhorar forca de preensao e tolerancia de carga distal.',
    descricao:
      'Apertar uma bola macia com controle, sem aumentar sintomas persistentes.',
    instrucoesPadrao:
      '1. Segure uma bola macia na palma da mao.\n2. Aperte gradualmente por poucos segundos e relaxe.\n3. Mantenha punho neutro e ombro relaxado.\n4. Pare se houver formigamento, perda de forca ou dor persistente.',
    cuidados: 'Usar baixa intensidade no inicio e evitar prender a respiracao.',
    contraindicacoes:
      'Evitar em inflamacao aguda intensa ou compressao neural sem liberacao.',
    imagemKey: 'PUNHO_PREENSAO',
    tags: ['punho', 'mao', 'preensao', 'fortalecimento'],
    status: ExercicioStatus.APROVADO,
  },
];
