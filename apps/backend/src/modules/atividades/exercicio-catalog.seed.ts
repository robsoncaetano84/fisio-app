import { ExercicioStatus } from './entities/exercicio.entity';
import { ExerciseImageType } from './exercise-image-type.enum';

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
  imagemKey: ExerciseImageType;
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
    imagemKey: ExerciseImageType.MOBILIDADE_LOMBAR_GATO_CAMELO,
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
    imagemKey: ExerciseImageType.PONTE_CURTA,
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
    imagemKey: ExerciseImageType.CONTROLE_CERVICAL_PROFUNDO,
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
    imagemKey: ExerciseImageType.ELEVACAO_ASSISTIDA_OMBRO,
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
    imagemKey: ExerciseImageType.AGACHAMENTO_PARCIAL_ASSISTIDO,
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
    imagemKey: ExerciseImageType.ABDUCAO_QUADRIL_DECUBITO_LATERAL,
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
    imagemKey: ExerciseImageType.EQUILIBRIO_BIPODAL_TRANSFERENCIA_PESO,
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
    imagemKey: ExerciseImageType.PREENSAO_MANUAL_BOLA_MACIA,
    tags: ['punho', 'mao', 'preensao', 'fortalecimento'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Mobilidade toracica em rotacao sentada',
    slug: 'mobilidade-toracica-rotacao-sentada',
    regiaoCorporal: 'TORACICA',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo: 'Melhorar mobilidade toracica e reduzir sobrecarga postural.',
    descricao:
      'Rotacao controlada do tronco em sedestacao, mantendo pelve estavel.',
    instrucoesPadrao:
      '1. Sente com os pes apoiados e coluna alongada.\n2. Cruze os bracos sobre o peito ou apoie as maos nos ombros.\n3. Gire lentamente o tronco para um lado ate uma amplitude confortavel.\n4. Retorne ao centro e repita para o outro lado, sem prender a respiracao.',
    cuidados:
      'Evitar compensar com a pelve ou forcar amplitude no final do movimento.',
    contraindicacoes:
      'Evitar em trauma recente, tontura importante ou dor toracica nao avaliada.',
    imagemKey: ExerciseImageType.MOBILIDADE_TORACICA_ROTACAO_SENTADA,
    tags: ['toracica', 'mobilidade', 'postura', 'rotacao'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Retracao escapular sentada',
    slug: 'retracao-escapular-sentada',
    regiaoCorporal: 'OMBRO',
    categoria: 'CONTROLE_MOTOR',
    nivel: 'INICIANTE',
    objetivo: 'Melhorar controle escapular e postura de cintura escapular.',
    descricao:
      'Aproximacao suave das escapulas com ombros relaxados e tronco alinhado.',
    instrucoesPadrao:
      '1. Sente com a coluna alinhada e ombros relaxados.\n2. Leve as escapulas suavemente para tras e para baixo.\n3. Segure por poucos segundos sem prender a respiracao.\n4. Relaxe devagar e pare se houver dor irradiada ou formigamento.',
    cuidados: 'Nao elevar os ombros em direcao as orelhas durante a retracao.',
    contraindicacoes:
      'Evitar em dor aguda intensa no ombro ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.RETRACAO_ESCAPULAR_SENTADA,
    tags: ['ombro', 'escapula', 'postura', 'controle_motor'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Isometria de rotacao externa de ombro',
    slug: 'isometria-rotacao-externa-ombro',
    regiaoCorporal: 'OMBRO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Ativar manguito rotador com baixa carga e sem movimento doloroso.',
    descricao:
      'Contracao isometrica de rotacao externa com cotovelo junto ao corpo.',
    instrucoesPadrao:
      '1. Fique de lado para uma parede, com cotovelo dobrado a 90 graus.\n2. Mantenha o cotovelo junto ao corpo e pressione o dorso da mao contra a parede.\n3. Sustente uma contracao leve por poucos segundos.\n4. Relaxe completamente e interrompa se a dor aumentar.',
    cuidados:
      'Usar baixa intensidade e manter punho neutro, sem rodar o tronco.',
    contraindicacoes:
      'Evitar em luxacao recente, fratura nao liberada ou dor aguda importante.',
    imagemKey: ExerciseImageType.ISOMETRIA_ROTACAO_EXTERNA_OMBRO,
    tags: ['ombro', 'manguito', 'isometria', 'rotacao_externa'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Extensao de joelho sentado',
    slug: 'extensao-joelho-sentado',
    regiaoCorporal: 'JOELHO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo: 'Ativar quadriceps e melhorar controle terminal de joelho.',
    descricao:
      'Extensao controlada do joelho em sedestacao, respeitando dor e amplitude.',
    instrucoesPadrao:
      '1. Sente com os pes apoiados e coluna alinhada.\n2. Estenda lentamente um joelho ate uma amplitude confortavel.\n3. Segure por poucos segundos e desca devagar.\n4. Alterne as pernas e pare se houver dor forte ou travamento.',
    cuidados: 'Evitar balanco rapido da perna ou prender a respiracao.',
    contraindicacoes:
      'Evitar em bloqueio articular, derrame importante ou dor aguda alta.',
    imagemKey: ExerciseImageType.EXTENSAO_JOELHO_SENTADO,
    tags: ['joelho', 'quadriceps', 'fortalecimento', 'controle_motor'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Sentar e levantar controlado',
    slug: 'sentar-levantar-controlado',
    regiaoCorporal: 'JOELHO_QUADRIL',
    categoria: 'FUNCIONAL',
    nivel: 'INICIANTE',
    objetivo:
      'Treinar transferencia funcional de carga com controle de joelho e quadril.',
    descricao:
      'Levantar e sentar em cadeira com velocidade controlada e alinhamento.',
    instrucoesPadrao:
      '1. Sente na ponta da cadeira com os pes bem apoiados.\n2. Incline levemente o tronco para frente e levante sem deixar os joelhos cairem para dentro.\n3. Sente novamente devagar, controlando a descida.\n4. Use apoio das maos se necessario e pare se houver instabilidade.',
    cuidados:
      'Escolher cadeira firme e manter os pes alinhados com joelhos e quadris.',
    contraindicacoes:
      'Evitar sem supervisao em alto risco de queda ou dor incapacitante.',
    imagemKey: ExerciseImageType.SENTAR_LEVANTAR_CONTROLADO,
    tags: ['joelho', 'quadril', 'funcional', 'sentar_levantar'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Alongamento de flexores de quadril em meio ajoelhado',
    slug: 'alongamento-flexores-quadril-meio-ajoelhado',
    regiaoCorporal: 'QUADRIL',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo: 'Melhorar mobilidade anterior do quadril e controle pelvico.',
    descricao:
      'Alongamento em meio ajoelhado com retroversao leve da pelve e tronco alinhado.',
    instrucoesPadrao:
      '1. Apoie um joelho no solo e mantenha o outro pe a frente.\n2. Contraia levemente o abdomen e leve a pelve para tras, sem arquear a lombar.\n3. Avance o corpo suavemente ate sentir alongamento na frente do quadril.\n4. Mantenha respiracao tranquila e interrompa se houver dor lombar.',
    cuidados:
      'Usar apoio se necessario e evitar hiperextensao lombar durante o movimento.',
    contraindicacoes:
      'Evitar em dor aguda no quadril, joelho sensivel ao apoio ou irritacao importante.',
    imagemKey: ExerciseImageType.ALONGAMENTO_FLEXORES_QUADRIL_MEIO_AJOELHADO,
    tags: ['quadril', 'flexores_quadril', 'mobilidade', 'pelve'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Marcha estacionaria com apoio',
    slug: 'marcha-estacionaria-com-apoio',
    regiaoCorporal: 'TORNOZELO',
    categoria: 'PROPRIOCEPCAO',
    nivel: 'INICIANTE',
    objetivo: 'Treinar apoio alternado, equilibrio e controle de tornozelo.',
    descricao:
      'Marcha parada com apoio proximo, elevando os pes de forma alternada.',
    instrucoesPadrao:
      '1. Fique em pe perto de uma bancada ou parede.\n2. Eleve um pe do solo como se estivesse marchando no lugar.\n3. Apoie novamente e alterne para o outro lado.\n4. Mantenha postura alinhada e pare se houver tontura ou perda de equilibrio.',
    cuidados:
      'Executar com apoio seguro e amplitude pequena nas primeiras repeticoes.',
    contraindicacoes:
      'Evitar sem supervisao em alto risco de queda, tontura ou instabilidade importante.',
    imagemKey: ExerciseImageType.MARCHA_ESTACIONARIA_APOIO,
    tags: ['tornozelo', 'equilibrio', 'marcha', 'apoio'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Mobilidade de punho em flexao e extensao',
    slug: 'mobilidade-punho-flexao-extensao',
    regiaoCorporal: 'PUNHO_MAO',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo: 'Melhorar mobilidade do punho com baixa irritabilidade.',
    descricao:
      'Movimento ativo de flexao e extensao do punho em amplitude toleravel.',
    instrucoesPadrao:
      '1. Apoie o antebraco sobre uma mesa, deixando a mao livre.\n2. Leve o punho lentamente para cima e depois para baixo.\n3. Mantenha os dedos relaxados e respire normalmente.\n4. Pare se houver formigamento, perda de forca ou dor persistente.',
    cuidados: 'Evitar movimentos rapidos e amplitude forcada.',
    contraindicacoes:
      'Evitar em fratura nao liberada, inflamacao aguda intensa ou compressao neural importante.',
    imagemKey: ExerciseImageType.MOBILIDADE_PUNHO_FLEXAO_EXTENSAO,
    tags: ['punho', 'mao', 'mobilidade', 'flexao_extensao'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Alongamento cervical lateral assistido',
    slug: 'alongamento-cervical-lateral-assistido',
    regiaoCorporal: 'CERVICAL',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo: 'Reduzir tensao cervical lateral e melhorar conforto postural.',
    descricao:
      'Inclinacao lateral suave da cabeca, sem tracao forte ou dor irradiada.',
    instrucoesPadrao:
      '1. Sente com a coluna alinhada e ombros relaxados.\n2. Incline a cabeca suavemente para um lado, aproximando a orelha do ombro.\n3. Use a mao apenas como apoio leve, sem puxar com forca.\n4. Retorne devagar e pare se houver tontura, formigamento ou dor irradiada.',
    cuidados:
      'Manter o movimento leve e evitar rodar a cabeca durante o alongamento.',
    contraindicacoes:
      'Evitar em tontura importante, sintomas neurologicos novos ou trauma cervical recente.',
    imagemKey: ExerciseImageType.ALONGAMENTO_CERVICAL_LATERAL_ASSISTIDO,
    tags: ['cervical', 'alongamento', 'postura', 'pescoco'],
    status: ExercicioStatus.APROVADO,
  },
  {
    nome: 'Deslizamento neural mediano',
    slug: 'deslizamento-neural-mediano',
    regiaoCorporal: 'PUNHO_MAO',
    categoria: 'MOBILIDADE_NEURAL',
    nivel: 'INICIANTE',
    objetivo:
      'Melhorar tolerancia neural distal sem provocar sintomas persistentes.',
    descricao:
      'Movimento suave de deslizamento neural para membro superior, com baixa carga.',
    instrucoesPadrao:
      '1. Sente com postura confortavel e ombro relaxado.\n2. Estenda lentamente o cotovelo e o punho ate sentir tensao leve.\n3. Retorne antes de provocar dor ou formigamento forte.\n4. Execute em baixa amplitude e pare se os sintomas permanecerem apos o exercicio.',
    cuidados:
      'Nao manter posicao final por tempo prolongado e evitar sintomas intensos.',
    contraindicacoes:
      'Evitar em deficit neurologico progressivo, perda de forca ou dor neural irritavel.',
    imagemKey: ExerciseImageType.DESLIZAMENTO_NEURAL_MEDIANO,
    tags: ['punho', 'mao', 'neural', 'mediano'],
    status: ExercicioStatus.APROVADO,
  },
];
