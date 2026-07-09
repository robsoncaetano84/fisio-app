import { ExercicioStatus } from './entities/exercicio.entity';
import { ExerciseImageType } from './exercise-image-type.enum';

export type PreviewExercicioSeed = {
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

export const PREVIEW_EXERCISE_CATALOG: PreviewExercicioSeed[] = [
  {
    nome: 'Prancha frontal no antebraco',
    slug: 'prancha-frontal-antebraco',
    regiaoCorporal: 'LOMBAR_QUADRIL',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de prancha frontal no antebraco.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: prancha frontal no antebraco.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute prancha frontal no antebraco em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar alinhamento cabeca-tronco-pelve, cotovelos sob ombros e ausencia de queda lombar.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.PRANCHA_FRONTAL_ANTEBRACO,
    tags: [
      'lombar_quadril',
      'fortalecimento',
      'prancha',
      'frontal',
      'antebraco',
    ],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Bird-dog / extensao alternada',
    slug: 'bird-dog-extensao-alternada',
    regiaoCorporal: 'LOMBAR_QUADRIL',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de bird-dog / extensao alternada.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: bird-dog / extensao alternada.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute bird-dog / extensao alternada em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar coluna neutra, pelve estavel e extensao contralateral clara de braco e perna.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.BIRD_DOG_EXTENSAO_ALTERNADA,
    tags: [
      'lombar_quadril',
      'fortalecimento',
      'bird',
      'dog',
      'extensao',
      'alternada',
    ],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Elevacao de perna reta',
    slug: 'elevacao-perna-reta',
    regiaoCorporal: 'QUADRIL',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de elevacao de perna reta.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: elevacao de perna reta.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute elevacao de perna reta em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar perna elevada com joelho estendido, pelve estavel e amplitude moderada.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ELEVACAO_PERNA_RETA,
    tags: ['quadril', 'fortalecimento', 'elevacao', 'perna', 'reta'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Alongamento posterior de coxa com faixa',
    slug: 'alongamento-posterior-coxa-faixa',
    regiaoCorporal: 'QUADRIL',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de alongamento posterior de coxa com faixa.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: alongamento posterior de coxa com faixa.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute alongamento posterior de coxa com faixa em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar faixa no pe, joelho quase estendido e alongamento sem tracao agressiva.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ALONGAMENTO_POSTERIOR_COXA_FAIXA,
    tags: [
      'quadril',
      'mobilidade',
      'alongamento',
      'posterior',
      'coxa',
      'faixa',
    ],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Alongamento piriforme em decubito dorsal',
    slug: 'alongamento-piriforme-decubito-dorsal',
    regiaoCorporal: 'LOMBAR_QUADRIL',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de alongamento piriforme em decubito dorsal.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: alongamento piriforme em decubito dorsal.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute alongamento piriforme em decubito dorsal em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar posicao tipo figura 4, apoio das maos e ausencia de flexao cervical forcada.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ALONGAMENTO_PIRIFORME_DECUBITO_DORSAL,
    tags: [
      'lombar_quadril',
      'mobilidade',
      'alongamento',
      'piriforme',
      'decubito',
      'dorsal',
    ],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Elevacao de panturrilha com apoio',
    slug: 'elevacao-panturrilha-apoio',
    regiaoCorporal: 'TORNOZELO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de elevacao de panturrilha com apoio.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: elevacao de panturrilha com apoio.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute elevacao de panturrilha com apoio em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar subida controlada dos calcanhares, apoio seguro e tronco alinhado.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ELEVACAO_PANTURRILHA_APOIO,
    tags: ['tornozelo', 'fortalecimento', 'elevacao', 'panturrilha', 'apoio'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Dorsiflexao de tornozelo com faixa',
    slug: 'dorsiflexao-tornozelo-faixa',
    regiaoCorporal: 'TORNOZELO',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de dorsiflexao de tornozelo com faixa.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: dorsiflexao de tornozelo com faixa.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute dorsiflexao de tornozelo com faixa em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar faixa no antepe, movimento de dorsiflexao e joelho sem compensacao.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.DORSIFLEXAO_TORNOZELO_FAIXA,
    tags: ['tornozelo', 'mobilidade', 'dorsiflexao', 'faixa'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Rotacao externa de ombro com faixa',
    slug: 'rotacao-externa-ombro-faixa',
    regiaoCorporal: 'OMBRO',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de rotacao externa de ombro com faixa.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: rotacao externa de ombro com faixa.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute rotacao externa de ombro com faixa em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar cotovelo junto ao corpo, ombro relaxado e arco de rotacao externa compreensivel.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ROTACAO_EXTERNA_OMBRO_FAIXA,
    tags: ['ombro', 'mobilidade', 'rotacao', 'externa', 'faixa'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Remada sentada com faixa',
    slug: 'remada-sentada-faixa',
    regiaoCorporal: 'OMBRO',
    categoria: 'FUNCIONAL',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de remada sentada com faixa.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: remada sentada com faixa.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute remada sentada com faixa em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar tronco ereto, escapulas controladas e cotovelos puxando para tras sem elevacao dos ombros.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.REMADA_SENTADA_FAIXA,
    tags: ['ombro', 'funcional', 'remada', 'sentada', 'faixa'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Abducao de ombro em pe',
    slug: 'abducao-ombro-em-pe',
    regiaoCorporal: 'OMBRO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de abducao de ombro em pe.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: abducao de ombro em pe.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute abducao de ombro em pe em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar elevacao lateral ate a linha do ombro, sem compensacao cervical ou elevacao excessiva da escapula.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ABDUCAO_OMBRO_EM_PE,
    tags: ['ombro', 'fortalecimento', 'abducao'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Mobilidade toracica em quatro apoios',
    slug: 'mobilidade-toracica-quatro-apoios-thread-needle',
    regiaoCorporal: 'TORACICA',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de mobilidade toracica em quatro apoios.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: mobilidade toracica em quatro apoios.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute mobilidade toracica em quatro apoios em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar rotacao toracica clara, pelve estavel e ausencia de carga excessiva cervical.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.MOBILIDADE_TORACICA_QUATRO_APOIOS,
    tags: ['toracica', 'mobilidade', 'quatro', 'apoios', 'thread', 'needle'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Dead bug',
    slug: 'dead-bug-controle-lombopelvico',
    regiaoCorporal: 'LOMBAR_QUADRIL',
    categoria: 'CONTROLE_MOTOR',
    nivel: 'INICIANTE',
    objetivo: 'Preparar revisao clinica e prescricao futura de dead bug.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: dead bug.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute dead bug em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar controle lombopelvico, braco e perna contralaterais e amplitude segura.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.DEAD_BUG_CONTROLE_LOMBOPELVICO,
    tags: [
      'lombar_quadril',
      'controle_motor',
      'dead',
      'bug',
      'controle',
      'lombopelvico',
    ],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Prancha lateral com joelhos apoiados',
    slug: 'prancha-lateral-joelhos-apoiados',
    regiaoCorporal: 'LOMBAR_QUADRIL',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de prancha lateral com joelhos apoiados.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: prancha lateral com joelhos apoiados.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute prancha lateral com joelhos apoiados em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar alinhamento lateral e se a posicao dos joelhos esta suficientemente clara.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.PRANCHA_LATERAL_JOELHOS_APOIADOS,
    tags: [
      'lombar_quadril',
      'fortalecimento',
      'prancha',
      'lateral',
      'joelhos',
      'apoiados',
    ],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Clamshell / abertura de quadril',
    slug: 'clamshell-abertura-quadril',
    regiaoCorporal: 'QUADRIL',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de clamshell / abertura de quadril.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: clamshell / abertura de quadril.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute clamshell / abertura de quadril em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar abertura do joelho superior, pes juntos e pelve sem rotacao posterior.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.CLAMSHELL_ABERTURA_QUADRIL,
    tags: ['quadril', 'fortalecimento', 'clamshell', 'abertura'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Extensao de quadril em quatro apoios',
    slug: 'extensao-quadril-quatro-apoios',
    regiaoCorporal: 'QUADRIL',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de extensao de quadril em quatro apoios.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: extensao de quadril em quatro apoios.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute extensao de quadril em quatro apoios em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar ativacao de gluteos, pelve nivelada e ausencia de hiperextensao lombar.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.EXTENSAO_QUADRIL_QUATRO_APOIOS,
    tags: ['quadril', 'fortalecimento', 'extensao', 'quatro', 'apoios'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Step-up baixo com apoio',
    slug: 'step-up-baixo-apoio',
    regiaoCorporal: 'JOELHO',
    categoria: 'FUNCIONAL',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de step-up baixo com apoio.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: step-up baixo com apoio.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute step-up baixo com apoio em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar degrau baixo, apoio seguro e joelho alinhado ao pe.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.STEP_UP_BAIXO_APOIO,
    tags: ['joelho', 'funcional', 'step', 'baixo', 'apoio'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Avanco assistido curto com apoio',
    slug: 'avanco-assistido-curto-apoio',
    regiaoCorporal: 'JOELHO',
    categoria: 'FUNCIONAL',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de avanco assistido curto com apoio.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: avanco assistido curto com apoio.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute avanco assistido curto com apoio em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar amplitude curta, tronco ereto e joelho anterior sem valgo.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.AVANCO_ASSISTIDO_CURTO_APOIO,
    tags: ['joelho', 'funcional', 'avanco', 'assistido', 'curto', 'apoio'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Wall slide',
    slug: 'wall-slide-deslizamento-bracos-parede',
    regiaoCorporal: 'OMBRO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo: 'Preparar revisao clinica e prescricao futura de wall slide.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: wall slide.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute wall slide em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar controle escapular, subida dos bracos e ausencia de elevacao compensatoria dos ombros.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.WALL_SLIDE_DESLIZAMENTO_BRACOS,
    tags: [
      'ombro',
      'fortalecimento',
      'wall',
      'slide',
      'deslizamento',
      'bracos',
      'parede',
    ],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Pendular de ombro / Codman',
    slug: 'pendular-ombro-codman',
    regiaoCorporal: 'OMBRO',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de pendular de ombro / Codman.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: pendular de ombro / Codman.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute pendular de ombro / Codman em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar braco relaxado, tronco apoiado e movimento pendular pequeno.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.PENDULAR_OMBRO_CODMAN,
    tags: ['ombro', 'mobilidade', 'pendular', 'codman'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Flexao de ombro com bastao',
    slug: 'flexao-ombro-bastao-decubito',
    regiaoCorporal: 'OMBRO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de flexao de ombro com bastao.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: flexao de ombro com bastao.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute flexao de ombro com bastao em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar movimento assistido, amplitude confortavel e ausencia de compensacao cervical.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.FLEXAO_OMBRO_BASTAO_DECUBITO,
    tags: ['ombro', 'fortalecimento', 'flexao', 'bastao', 'decubito'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Flexao/extensao de cotovelo com halter',
    slug: 'flexao-extensao-cotovelo-halter',
    regiaoCorporal: 'COTOVELO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de flexao/extensao de cotovelo com halter.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: flexao/extensao de cotovelo com halter.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute flexao/extensao de cotovelo com halter em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar cotovelo junto ao corpo, ombro relaxado e carga visual leve.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.FLEXAO_EXTENSAO_COTOVELO_HALTER,
    tags: ['cotovelo', 'fortalecimento', 'flexao', 'extensao', 'halter'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Pronacao/supinacao de antebraco',
    slug: 'pronacao-supinacao-antebraco',
    regiaoCorporal: 'COTOVELO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de pronacao/supinacao de antebraco.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: pronacao/supinacao de antebraco.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute pronacao/supinacao de antebraco em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar apoio do antebraco, cotovelo a 90 graus e rotacao clara da palma.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.PRONACAO_SUPINACAO_ANTEBRACO,
    tags: ['cotovelo', 'fortalecimento', 'pronacao', 'supinacao', 'antebraco'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Oposicao do polegar',
    slug: 'oposicao-polegar',
    regiaoCorporal: 'PUNHO_MAO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de oposicao do polegar.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: oposicao do polegar.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute oposicao do polegar em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar movimento do polegar, punho neutro e clareza para paciente.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.OPOSICAO_POLEGAR,
    tags: ['punho_mao', 'fortalecimento', 'oposicao', 'polegar'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Eversao de tornozelo com faixa',
    slug: 'eversao-tornozelo-faixa',
    regiaoCorporal: 'TORNOZELO',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de eversao de tornozelo com faixa.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: eversao de tornozelo com faixa.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute eversao de tornozelo com faixa em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar movimento do pe para fora, joelho estavel e faixa bem posicionada.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.EVERSAO_TORNOZELO_FAIXA,
    tags: ['tornozelo', 'mobilidade', 'eversao', 'faixa'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Alongamento de panturrilha na parede',
    slug: 'alongamento-panturrilha-parede',
    regiaoCorporal: 'TORNOZELO',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de alongamento de panturrilha na parede.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: alongamento de panturrilha na parede.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute alongamento de panturrilha na parede em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar calcanhar posterior no solo, joelho posterior estendido e apoio na parede.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ALONGAMENTO_PANTURRILHA_PAREDE,
    tags: ['tornozelo', 'mobilidade', 'alongamento', 'panturrilha', 'parede'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Flexao de joelho em pe com apoio',
    slug: 'flexao-joelho-em-pe-apoio',
    regiaoCorporal: 'JOELHO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de flexao de joelho em pe com apoio.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: flexao de joelho em pe com apoio.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute flexao de joelho em pe com apoio em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar flexao do joelho sem compensacao lombar e apoio seguro.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.FLEXAO_JOELHO_EM_PE_APOIO,
    tags: ['joelho', 'fortalecimento', 'flexao', 'apoio'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Agachamento isometrico na parede',
    slug: 'agachamento-isometrico-parede',
    regiaoCorporal: 'JOELHO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de agachamento isometrico na parede.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: agachamento isometrico na parede.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute agachamento isometrico na parede em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar amplitude rasa, costas apoiadas e alinhamento dos joelhos.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.AGACHAMENTO_ISOMETRICO_PAREDE,
    tags: ['joelho', 'fortalecimento', 'agachamento', 'isometrico', 'parede'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Ponte com marcha alternada',
    slug: 'ponte-com-marcha-alternada',
    regiaoCorporal: 'LOMBAR_QUADRIL',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de ponte com marcha alternada.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: ponte com marcha alternada.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute ponte com marcha alternada em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar pelve nivelada, ponte sem hiperextensao e elevacao pequena do joelho.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.PONTE_COM_MARCHA_ALTERNADA,
    tags: ['lombar_quadril', 'fortalecimento', 'ponte', 'marcha', 'alternada'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Elevacao lateral de perna em pe',
    slug: 'elevacao-lateral-perna-em-pe',
    regiaoCorporal: 'MOBILIDADE_GERAL',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de elevacao lateral de perna em pe.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: elevacao lateral de perna em pe.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute elevacao lateral de perna em pe em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar pelve estavel, tronco sem inclinacao e amplitude baixa.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ELEVACAO_LATERAL_PERNA_EM_PE,
    tags: [
      'mobilidade_geral',
      'fortalecimento',
      'elevacao',
      'lateral',
      'perna',
    ],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Respiracao diafragmatica em decubito',
    slug: 'respiracao-diafragmatica-decubito',
    regiaoCorporal: 'TORACICA',
    categoria: 'CONTROLE_MOTOR',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de respiracao diafragmatica em decubito.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: respiracao diafragmatica em decubito.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute respiracao diafragmatica em decubito em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar maos em torax/abdome, postura relaxada e destaque no movimento abdominal.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.RESPIRACAO_DIAFRAGMATICA_DECUBITO,
    tags: [
      'toracica',
      'controle_motor',
      'respiracao',
      'diafragmatica',
      'decubito',
    ],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Inclinacao pelvica posterior',
    slug: 'inclinacao-pelvica-posterior-decubito',
    regiaoCorporal: 'LOMBAR_QUADRIL',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de inclinacao pelvica posterior.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: inclinacao pelvica posterior.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute inclinacao pelvica posterior em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar controle lombopelvico, joelhos flexionados e movimento sutil da pelve.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.INCLINACAO_PELVICA_POSTERIOR_DECUBITO,
    tags: [
      'lombar_quadril',
      'fortalecimento',
      'inclinacao',
      'pelvica',
      'posterior',
      'decubito',
    ],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Joelho ao peito unilateral',
    slug: 'joelho-ao-peito-unilateral',
    regiaoCorporal: 'LOMBAR_QUADRIL',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de joelho ao peito unilateral.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: joelho ao peito unilateral.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute joelho ao peito unilateral em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar alongamento suave, ombros relaxados e ausencia de tracao cervical.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.JOELHO_AO_PEITO_UNILATERAL,
    tags: ['lombar_quadril', 'mobilidade', 'joelho', 'peito', 'unilateral'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Rotacao lombar em decubito',
    slug: 'rotacao-lombar-decubito',
    regiaoCorporal: 'LOMBAR_QUADRIL',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de rotacao lombar em decubito.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: rotacao lombar em decubito.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute rotacao lombar em decubito em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar joelhos rodando juntos, ombros apoiados e amplitude confortavel.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ROTACAO_LOMBAR_DECUBITO,
    tags: ['lombar_quadril', 'mobilidade', 'rotacao', 'lombar', 'decubito'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Isometria de quadriceps com toalha',
    slug: 'isometria-quadriceps-toalha',
    regiaoCorporal: 'JOELHO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de isometria de quadriceps com toalha.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: isometria de quadriceps com toalha.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute isometria de quadriceps com toalha em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar toalha sob joelho, pressao para baixo e tornozelo relaxado.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ISOMETRIA_QUADRICEPS_TOALHA,
    tags: ['joelho', 'fortalecimento', 'isometria', 'quadriceps', 'toalha'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Extensao terminal de joelho com faixa',
    slug: 'extensao-terminal-joelho-faixa',
    regiaoCorporal: 'JOELHO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de extensao terminal de joelho com faixa.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: extensao terminal de joelho com faixa.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute extensao terminal de joelho com faixa em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar faixa atras do joelho, pe apoiado e extensao sem hiperextensao.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.EXTENSAO_TERMINAL_JOELHO_FAIXA,
    tags: ['joelho', 'fortalecimento', 'extensao', 'terminal', 'faixa'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Isometria de adutores com bola',
    slug: 'isometria-adutores-bola',
    regiaoCorporal: 'QUADRIL',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de isometria de adutores com bola.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: isometria de adutores com bola.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute isometria de adutores com bola em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar bola entre joelhos, pes apoiados e tronco ereto.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ISOMETRIA_ADUTORES_BOLA,
    tags: ['quadril', 'fortalecimento', 'isometria', 'adutores', 'bola'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Flexao plantar com faixa',
    slug: 'flexao-plantar-faixa',
    regiaoCorporal: 'TORNOZELO',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de flexao plantar com faixa.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: flexao plantar com faixa.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute flexao plantar com faixa em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar faixa no antepe, movimento para baixo e joelho sem compensacao.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.FLEXAO_PLANTAR_FAIXA,
    tags: ['tornozelo', 'mobilidade', 'flexao', 'plantar', 'faixa'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Inversao de tornozelo com faixa',
    slug: 'inversao-tornozelo-faixa',
    regiaoCorporal: 'TORNOZELO',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de inversao de tornozelo com faixa.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: inversao de tornozelo com faixa.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute inversao de tornozelo com faixa em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar movimento do pe para dentro e joelho estavel.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.INVERSAO_TORNOZELO_FAIXA,
    tags: ['tornozelo', 'mobilidade', 'inversao', 'faixa'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Circulos de tornozelo sentado',
    slug: 'circulos-tornozelo-sentado',
    regiaoCorporal: 'TORNOZELO',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de circulos de tornozelo sentado.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: circulos de tornozelo sentado.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute circulos de tornozelo sentado em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar movimento circular no tornozelo, coxa estavel e tronco alinhado.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.CIRCULOS_TORNOZELO_SENTADO,
    tags: ['tornozelo', 'mobilidade', 'circulos', 'sentado'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Extensao toracica no encosto',
    slug: 'extensao-toracica-encosto-cadeira',
    regiaoCorporal: 'TORACICA',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de extensao toracica no encosto.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: extensao toracica no encosto.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute extensao toracica no encosto em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar extensao no torax, nao na lombar, e apoio seguro na cadeira.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.EXTENSAO_TORACICA_ENCOSTO_CADEIRA,
    tags: ['toracica', 'fortalecimento', 'extensao', 'encosto', 'cadeira'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Alongamento peitoral na porta',
    slug: 'alongamento-peitoral-porta',
    regiaoCorporal: 'OMBRO',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de alongamento peitoral na porta.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: alongamento peitoral na porta.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute alongamento peitoral na porta em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar antebraco no batente, ombro relaxado e rotacao leve do tronco.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ALONGAMENTO_PEITORAL_PORTA,
    tags: ['ombro', 'mobilidade', 'alongamento', 'peitoral', 'porta'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Isometria de flexao de ombro na parede',
    slug: 'isometria-flexao-ombro-parede',
    regiaoCorporal: 'OMBRO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de isometria de flexao de ombro na parede.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: isometria de flexao de ombro na parede.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute isometria de flexao de ombro na parede em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar pressao para frente, ombro baixo e tronco neutro.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ISOMETRIA_FLEXAO_OMBRO_PAREDE,
    tags: ['ombro', 'fortalecimento', 'isometria', 'flexao', 'parede'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Isometria de abducao de ombro na parede',
    slug: 'isometria-abducao-ombro-parede',
    regiaoCorporal: 'OMBRO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de isometria de abducao de ombro na parede.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: isometria de abducao de ombro na parede.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute isometria de abducao de ombro na parede em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar pressao lateral, sem elevacao do ombro e sem inclinacao do tronco.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ISOMETRIA_ABDUCAO_OMBRO_PAREDE,
    tags: ['ombro', 'fortalecimento', 'isometria', 'abducao', 'parede'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Rotacao interna de ombro com faixa',
    slug: 'rotacao-interna-ombro-faixa',
    regiaoCorporal: 'OMBRO',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de rotacao interna de ombro com faixa.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: rotacao interna de ombro com faixa.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute rotacao interna de ombro com faixa em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar cotovelo junto ao corpo e movimento sem rotacao do tronco.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ROTACAO_INTERNA_OMBRO_FAIXA,
    tags: ['ombro', 'mobilidade', 'rotacao', 'interna', 'faixa'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Extensao de ombro com faixa',
    slug: 'extensao-ombro-faixa',
    regiaoCorporal: 'OMBRO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de extensao de ombro com faixa.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: extensao de ombro com faixa.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute extensao de ombro com faixa em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar puxada para tras, cotovelo estavel e ombro sem encolher.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.EXTENSAO_OMBRO_FAIXA,
    tags: ['ombro', 'fortalecimento', 'extensao', 'faixa'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Remada em pe com faixa',
    slug: 'remada-em-pe-faixa',
    regiaoCorporal: 'OMBRO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de remada em pe com faixa.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: remada em pe com faixa.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute remada em pe com faixa em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar escapulas controladas, cotovelos para tras e postura neutra.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.REMADA_EM_PE_FAIXA,
    tags: ['ombro', 'fortalecimento', 'remada', 'faixa'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Desvio radial/ulnar de punho',
    slug: 'desvio-radial-ulnar-punho',
    regiaoCorporal: 'PUNHO_MAO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de desvio radial/ulnar de punho.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: desvio radial/ulnar de punho.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute desvio radial/ulnar de punho em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar antebraco apoiado, um unico peso e movimento lateral do punho.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.DESVIO_RADIAL_ULNAR_PUNHO,
    tags: ['punho_mao', 'fortalecimento', 'desvio', 'radial', 'ulnar', 'punho'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Extensao dos dedos com elastico',
    slug: 'extensao-dedos-elastico',
    regiaoCorporal: 'PUNHO_MAO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de extensao dos dedos com elastico.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: extensao dos dedos com elastico.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute extensao dos dedos com elastico em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar elastico nos dedos, punho neutro e abertura controlada.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.EXTENSAO_DEDOS_ELASTICO,
    tags: ['punho_mao', 'fortalecimento', 'extensao', 'dedos', 'elastico'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Equilibrio unipodal com apoio',
    slug: 'equilibrio-unipodal-apoio',
    regiaoCorporal: 'TORNOZELO',
    categoria: 'PROPRIOCEPCAO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de equilibrio unipodal com apoio.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: equilibrio unipodal com apoio.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute equilibrio unipodal com apoio em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar apoio leve, pelve nivelada e tronco sem inclinacao.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.EQUILIBRIO_UNIPODAL_APOIO,
    tags: ['tornozelo', 'propriocepcao', 'equilibrio', 'unipodal', 'apoio'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Deslizamento de calcanhar',
    slug: 'deslizamento-calcanhar-decubito',
    regiaoCorporal: 'LOMBAR_QUADRIL',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de deslizamento de calcanhar.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: deslizamento de calcanhar.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute deslizamento de calcanhar em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar calcanhar deslizando no solo, pelve estavel e movimento suave.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.DESLIZAMENTO_CALCANHAR_DECUBITO,
    tags: [
      'lombar_quadril',
      'fortalecimento',
      'deslizamento',
      'calcanhar',
      'decubito',
    ],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Flexao de braco na parede',
    slug: 'flexao-braco-parede',
    regiaoCorporal: 'MOBILIDADE_GERAL',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de flexao de braco na parede.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: flexao de braco na parede.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute flexao de braco na parede em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar alinhamento de tronco, cotovelos e apoio seguro das maos na parede.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.FLEXAO_BRACO_PAREDE,
    tags: ['mobilidade_geral', 'fortalecimento', 'flexao', 'braco', 'parede'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Soco do serratil em decubito',
    slug: 'soco-serratil-decubito',
    regiaoCorporal: 'OMBRO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de soco do serratil em decubito.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: soco do serratil em decubito.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute soco do serratil em decubito em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar ombro a 90 graus, cotovelo estendido e movimento de protracao escapular.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.SOCO_SERRATIL_DECUBITO,
    tags: ['ombro', 'fortalecimento', 'soco', 'serratil', 'decubito'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Relogio escapular na parede',
    slug: 'relogio-escapular-parede',
    regiaoCorporal: 'OMBRO',
    categoria: 'CONTROLE_MOTOR',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de relogio escapular na parede.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: relogio escapular na parede.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute relogio escapular na parede em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar mao apoiada, movimento escapular circular e tronco sem rodar.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.RELOGIO_ESCAPULAR_PAREDE,
    tags: ['ombro', 'controle_motor', 'relogio', 'escapular', 'parede'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Elevacao no plano da escapula',
    slug: 'elevacao-plano-escapula-scaption',
    regiaoCorporal: 'OMBRO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de elevacao no plano da escapula.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: elevacao no plano da escapula.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute elevacao no plano da escapula em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar elevacao no plano escapular, polegar para cima e ombro sem compensacao.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ELEVACAO_PLANO_ESCAPULA_SCAPTION,
    tags: [
      'ombro',
      'fortalecimento',
      'elevacao',
      'plano',
      'escapula',
      'scaption',
    ],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Extensao de cotovelo com faixa',
    slug: 'extensao-cotovelo-faixa',
    regiaoCorporal: 'COTOVELO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de extensao de cotovelo com faixa.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: extensao de cotovelo com faixa.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute extensao de cotovelo com faixa em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar cotovelo junto ao corpo, punho neutro e extensao sem elevar o ombro.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.EXTENSAO_COTOVELO_FAIXA,
    tags: ['cotovelo', 'fortalecimento', 'extensao', 'faixa'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Pull-apart com faixa',
    slug: 'pull-apart-faixa',
    regiaoCorporal: 'OMBRO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de pull-apart com faixa.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: pull-apart com faixa.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute pull-apart com faixa em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar cotovelos estendidos, escapulas controladas e faixa na altura correta.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.PULL_APART_FAIXA,
    tags: ['ombro', 'fortalecimento', 'pull', 'apart', 'faixa'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Abducao de quadril com faixa',
    slug: 'abducao-quadril-faixa-joelhos',
    regiaoCorporal: 'JOELHO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de abducao de quadril com faixa.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: abducao de quadril com faixa.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute abducao de quadril com faixa em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar apoio leve, pelve nivelada e movimento lateral sem inclinacao do tronco.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ABDUCAO_QUADRIL_FAIXA_JOELHOS,
    tags: [
      'joelho',
      'fortalecimento',
      'abducao',
      'quadril',
      'faixa',
      'joelhos',
    ],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Caminhada lateral com faixa',
    slug: 'caminhada-lateral-faixa',
    regiaoCorporal: 'TORNOZELO',
    categoria: 'FUNCIONAL',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de caminhada lateral com faixa.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: caminhada lateral com faixa.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute caminhada lateral com faixa em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar joelhos alinhados, quadril ativo e passo lateral controlado.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.CAMINHADA_LATERAL_FAIXA,
    tags: ['tornozelo', 'funcional', 'caminhada', 'lateral', 'faixa'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Dobradica de quadril com bastao',
    slug: 'dobradica-quadril-bastao',
    regiaoCorporal: 'QUADRIL',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de dobradica de quadril com bastao.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: dobradica de quadril com bastao.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute dobradica de quadril com bastao em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar coluna neutra, movimento partindo do quadril e bastao alinhado.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.DOBRADICA_QUADRIL_BASTAO,
    tags: ['quadril', 'fortalecimento', 'dobradica', 'bastao'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Step-down baixo',
    slug: 'step-down-baixo',
    regiaoCorporal: 'JOELHO',
    categoria: 'FUNCIONAL',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de step-down baixo.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: step-down baixo.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute step-down baixo em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar controle do joelho, apoio seguro e descida lenta do membro livre.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.STEP_DOWN_BAIXO,
    tags: ['joelho', 'funcional', 'step', 'down', 'baixo'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Caminhada nos calcanhares',
    slug: 'caminhada-calcanhares',
    regiaoCorporal: 'TORNOZELO',
    categoria: 'PROPRIOCEPCAO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de caminhada nos calcanhares.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: caminhada nos calcanhares.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute caminhada nos calcanhares em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar dorsiflexao dos tornozelos, dedos elevados e postura ereta.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.CAMINHADA_CALCANHARES,
    tags: ['tornozelo', 'propriocepcao', 'caminhada', 'calcanhares'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Caminhada na ponta dos pes',
    slug: 'caminhada-ponta-pes',
    regiaoCorporal: 'TORNOZELO',
    categoria: 'PROPRIOCEPCAO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de caminhada na ponta dos pes.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: caminhada na ponta dos pes.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute caminhada na ponta dos pes em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar elevacao dos calcanhares, alinhamento dos tornozelos e equilibrio.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.CAMINHADA_PONTA_PES,
    tags: ['tornozelo', 'propriocepcao', 'caminhada', 'ponta', 'pes'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Short foot',
    slug: 'short-foot-arco-plantar',
    regiaoCorporal: 'TORNOZELO',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo: 'Preparar revisao clinica e prescricao futura de short foot.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: short foot.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute short foot em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar elevacao sutil do arco sem flexionar excessivamente os dedos.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.SHORT_FOOT_ARCO_PLANTAR,
    tags: ['tornozelo', 'mobilidade', 'short', 'foot', 'arco', 'plantar'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Enrugar toalha com dedos',
    slug: 'enrugar-toalha-dedos-pe',
    regiaoCorporal: 'TORNOZELO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de enrugar toalha com dedos.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: enrugar toalha com dedos.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute enrugar toalha com dedos em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar dedos puxando a toalha, calcanhar apoiado e tornozelo estavel.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ENRUGAR_TOALHA_DEDOS_PE,
    tags: ['tornozelo', 'fortalecimento', 'enrugar', 'toalha', 'dedos', 'pe'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Rotacao cervical sentada',
    slug: 'rotacao-cervical-sentada',
    regiaoCorporal: 'CERVICAL',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de rotacao cervical sentada.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: rotacao cervical sentada.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute rotacao cervical sentada em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar movimento apenas da cervical, ombros relaxados e tronco alinhado.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ROTACAO_CERVICAL_SENTADA,
    tags: ['cervical', 'mobilidade', 'rotacao', 'sentada'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Extensao cervical sentada',
    slug: 'extensao-cervical-sentada',
    regiaoCorporal: 'CERVICAL',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de extensao cervical sentada.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: extensao cervical sentada.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute extensao cervical sentada em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar extensao cervical controlada, sem exagero de amplitude ou compensacao toracica.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.EXTENSAO_CERVICAL_SENTADA,
    tags: ['cervical', 'mobilidade', 'extensao', 'sentada'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Marcha sentada',
    slug: 'marcha-sentada',
    regiaoCorporal: 'JOELHO_QUADRIL',
    categoria: 'FUNCIONAL',
    nivel: 'INICIANTE',
    objetivo: 'Preparar revisao clinica e prescricao futura de marcha sentada.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: marcha sentada.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute marcha sentada em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar elevacao alternada do joelho, tronco ereto e apoio estavel na cadeira.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.MARCHA_SENTADA,
    tags: ['joelho_quadril', 'funcional', 'marcha', 'sentada'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Extensao de joelho sentado',
    slug: 'extensao-joelho-sentado-longa',
    regiaoCorporal: 'JOELHO',
    categoria: 'FORTALECIMENTO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de extensao de joelho sentado.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: extensao de joelho sentado.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute extensao de joelho sentado em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar extensao do joelho sem travar, coxa apoiada e tornozelo neutro.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.EXTENSAO_JOELHO_SENTADO_LONGA,
    tags: ['joelho', 'fortalecimento', 'extensao', 'sentado', 'longa'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Rotacao de tronco sentada',
    slug: 'rotacao-tronco-sentada',
    regiaoCorporal: 'TORACICA',
    categoria: 'MOBILIDADE',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de rotacao de tronco sentada.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: rotacao de tronco sentada.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute rotacao de tronco sentada em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar rotacao toracica controlada, pelve estavel e pes apoiados.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.ROTACAO_TRONCO_SENTADA,
    tags: ['toracica', 'mobilidade', 'rotacao', 'tronco', 'sentada'],
    status: ExercicioStatus.RASCUNHO,
  },
  {
    nome: 'Apoio tandem com apoio',
    slug: 'apoio-tandem-com-apoio',
    regiaoCorporal: 'TORNOZELO',
    categoria: 'PROPRIOCEPCAO',
    nivel: 'INICIANTE',
    objetivo:
      'Preparar revisao clinica e prescricao futura de apoio tandem com apoio.',
    descricao:
      'Exercicio em preview visual para expansao do catalogo proprio Synap: apoio tandem com apoio.',
    instrucoesPadrao:
      '1. Prepare um ambiente seguro, com apoio estavel por perto quando necessario.\n2. Execute apoio tandem com apoio em amplitude confortavel e com velocidade controlada.\n3. Mantenha respiracao calma e evite compensacoes bruscas durante o movimento.\n4. Interrompa e avise o fisioterapeuta se houver tontura, formigamento, perda de forca ou piora que persista por 24h.',
    cuidados:
      'Pendente de revisao clinica antes de liberar para prescricao. Validar pes em linha, apoio leve da mao e tronco sem inclinacao lateral.',
    contraindicacoes:
      'Nao liberar para prescricao sem revisao clinica registrada. Evitar em dor aguda intensa, instabilidade importante, tontura ou sintomas neurologicos progressivos.',
    imagemKey: ExerciseImageType.APOIO_TANDEM_COM_APOIO,
    tags: ['tornozelo', 'propriocepcao', 'apoio', 'tandem'],
    status: ExercicioStatus.RASCUNHO,
  },
];
