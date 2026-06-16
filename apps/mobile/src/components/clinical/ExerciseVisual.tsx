import React, { useMemo } from "react";
import {
  Image,
  StyleSheet,
  Text,
  type ImageSourcePropType,
  View,
} from "react-native";
import Svg, {
  Circle,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { BORDER_RADIUS, COLORS, FONTS, SPACING } from "../../constants/theme";

export type ExerciseImageType =
  | "MOBILIDADE_GERAL"
  | "MOBILIDADE_LOMBAR"
  | "CONTROLE_CERVICAL"
  | "OMBRO_MANGUITO"
  | "JOELHO_AGACHAMENTO"
  | "QUADRIL_GLUTEOS"
  | "TORNOZELO_EQUILIBRIO"
  | "PUNHO_PREENSAO"
  | "MOBILIDADE_LOMBAR_GATO_CAMELO"
  | "PONTE_CURTA"
  | "CONTROLE_CERVICAL_PROFUNDO"
  | "ELEVACAO_ASSISTIDA_OMBRO"
  | "AGACHAMENTO_PARCIAL_ASSISTIDO"
  | "ABDUCAO_QUADRIL_DECUBITO_LATERAL"
  | "EQUILIBRIO_BIPODAL_TRANSFERENCIA_PESO"
  | "PREENSAO_MANUAL_BOLA_MACIA"
  | "MOBILIDADE_TORACICA_ROTACAO_SENTADA"
  | "RETRACAO_ESCAPULAR_SENTADA"
  | "ISOMETRIA_ROTACAO_EXTERNA_OMBRO"
  | "EXTENSAO_JOELHO_SENTADO"
  | "SENTAR_LEVANTAR_CONTROLADO"
  | "ALONGAMENTO_FLEXORES_QUADRIL_MEIO_AJOELHADO"
  | "MARCHA_ESTACIONARIA_APOIO"
  | "MOBILIDADE_PUNHO_FLEXAO_EXTENSAO"
  | "ALONGAMENTO_CERVICAL_LATERAL_ASSISTIDO"
  | "DESLIZAMENTO_NEURAL_MEDIANO"
  | "PRANCHA_FRONTAL_ANTEBRACO"
  | "BIRD_DOG_EXTENSAO_ALTERNADA"
  | "ELEVACAO_PERNA_RETA"
  | "ALONGAMENTO_POSTERIOR_COXA_FAIXA"
  | "ALONGAMENTO_PIRIFORME_DECUBITO_DORSAL"
  | "ELEVACAO_PANTURRILHA_APOIO"
  | "DORSIFLEXAO_TORNOZELO_FAIXA"
  | "ROTACAO_EXTERNA_OMBRO_FAIXA"
  | "REMADA_SENTADA_FAIXA"
  | "ABDUCAO_OMBRO_EM_PE"
  | "MOBILIDADE_TORACICA_QUATRO_APOIOS"
  | "DEAD_BUG_CONTROLE_LOMBOPELVICO"
  | "PRANCHA_LATERAL_JOELHOS_APOIADOS"
  | "CLAMSHELL_ABERTURA_QUADRIL"
  | "EXTENSAO_QUADRIL_QUATRO_APOIOS"
  | "STEP_UP_BAIXO_APOIO"
  | "AVANCO_ASSISTIDO_CURTO_APOIO"
  | "WALL_SLIDE_DESLIZAMENTO_BRACOS"
  | "PENDULAR_OMBRO_CODMAN"
  | "FLEXAO_OMBRO_BASTAO_DECUBITO"
  | "FLEXAO_EXTENSAO_COTOVELO_HALTER"
  | "PRONACAO_SUPINACAO_ANTEBRACO"
  | "OPOSICAO_POLEGAR"
  | "EVERSAO_TORNOZELO_FAIXA"
  | "ALONGAMENTO_PANTURRILHA_PAREDE"
  | "FLEXAO_JOELHO_EM_PE_APOIO"
  | "AGACHAMENTO_ISOMETRICO_PAREDE"
  | "PONTE_COM_MARCHA_ALTERNADA"
  | "ELEVACAO_LATERAL_PERNA_EM_PE"
  | "RESPIRACAO_DIAFRAGMATICA_DECUBITO"
  | "INCLINACAO_PELVICA_POSTERIOR_DECUBITO"
  | "JOELHO_AO_PEITO_UNILATERAL"
  | "ROTACAO_LOMBAR_DECUBITO"
  | "ISOMETRIA_QUADRICEPS_TOALHA"
  | "EXTENSAO_TERMINAL_JOELHO_FAIXA"
  | "ISOMETRIA_ADUTORES_BOLA"
  | "FLEXAO_PLANTAR_FAIXA"
  | "INVERSAO_TORNOZELO_FAIXA"
  | "CIRCULOS_TORNOZELO_SENTADO"
  | "EXTENSAO_TORACICA_ENCOSTO_CADEIRA"
  | "ALONGAMENTO_PEITORAL_PORTA"
  | "ISOMETRIA_FLEXAO_OMBRO_PAREDE"
  | "ISOMETRIA_ABDUCAO_OMBRO_PAREDE"
  | "ROTACAO_INTERNA_OMBRO_FAIXA"
  | "EXTENSAO_OMBRO_FAIXA"
  | "REMADA_EM_PE_FAIXA"
  | "DESVIO_RADIAL_ULNAR_PUNHO"
  | "EXTENSAO_DEDOS_ELASTICO"
  | "EQUILIBRIO_UNIPODAL_APOIO"
  | "DESLIZAMENTO_CALCANHAR_DECUBITO"
  | "FLEXAO_BRACO_PAREDE"
  | "SOCO_SERRATIL_DECUBITO"
  | "RELOGIO_ESCAPULAR_PAREDE"
  | "ELEVACAO_PLANO_ESCAPULA_SCAPTION"
  | "EXTENSAO_COTOVELO_FAIXA"
  | "PULL_APART_FAIXA"
  | "ABDUCAO_QUADRIL_FAIXA_JOELHOS"
  | "CAMINHADA_LATERAL_FAIXA"
  | "DOBRADICA_QUADRIL_BASTAO"
  | "STEP_DOWN_BAIXO"
  | "CAMINHADA_CALCANHARES"
  | "CAMINHADA_PONTA_PES"
  | "SHORT_FOOT_ARCO_PLANTAR"
  | "ENRUGAR_TOALHA_DEDOS_PE"
  | "ROTACAO_CERVICAL_SENTADA"
  | "EXTENSAO_CERVICAL_SENTADA"
  | "MARCHA_SENTADA"
  | "EXTENSAO_JOELHO_SENTADO_LONGA"
  | "ROTACAO_TRONCO_SENTADA"
  | "APOIO_TANDEM_COM_APOIO";

export const EXERCISE_IMAGE_OPTIONS: Array<{
  value: ExerciseImageType;
  label: string;
  hint: string;
}> = [
  {
    value: "MOBILIDADE_GERAL",
    label: "Mobilidade geral",
    hint: "Movimento ativo em amplitude toleravel",
  },
  {
    value: "MOBILIDADE_LOMBAR",
    label: "Mobilidade lombar",
    hint: "Controle lombo-pelvico e ponte curta",
  },
  {
    value: "CONTROLE_CERVICAL",
    label: "Controle cervical",
    hint: "Postura cervical e estabilidade escapular",
  },
  {
    value: "OMBRO_MANGUITO",
    label: "Ombro e manguito",
    hint: "Controle escapular e movimento assistido",
  },
  {
    value: "JOELHO_AGACHAMENTO",
    label: "Joelho/agachamento",
    hint: "Agachamento parcial e controle de alinhamento",
  },
  {
    value: "QUADRIL_GLUTEOS",
    label: "Quadril/gluteos",
    hint: "Ativacao de gluteos e controle pelvico",
  },
  {
    value: "TORNOZELO_EQUILIBRIO",
    label: "Tornozelo/equilibrio",
    hint: "Apoio e propriocepcao",
  },
  {
    value: "PUNHO_PREENSAO",
    label: "Punho/preensao",
    hint: "Mobilidade distal e forca de preensao",
  },
  {
    value: "MOBILIDADE_LOMBAR_GATO_CAMELO",
    label: "Gato-camelo lombar",
    hint: "Mobilidade suave da coluna em quatro apoios",
  },
  {
    value: "PONTE_CURTA",
    label: "Ponte curta",
    hint: "Ativacao de gluteos em decubito dorsal",
  },
  {
    value: "CONTROLE_CERVICAL_PROFUNDO",
    label: "Controle cervical profundo",
    hint: "Recolher o queixo com baixa amplitude",
  },
  {
    value: "ELEVACAO_ASSISTIDA_OMBRO",
    label: "Elevacao assistida de ombro",
    hint: "Elevacao com apoio e amplitude toleravel",
  },
  {
    value: "AGACHAMENTO_PARCIAL_ASSISTIDO",
    label: "Agachamento parcial assistido",
    hint: "Controle de joelho e quadril com apoio",
  },
  {
    value: "ABDUCAO_QUADRIL_DECUBITO_LATERAL",
    label: "Abducao de quadril lateral",
    hint: "Elevacao lateral da perna com pelve estavel",
  },
  {
    value: "EQUILIBRIO_BIPODAL_TRANSFERENCIA_PESO",
    label: "Transferencia de peso bipodal",
    hint: "Controle de apoio entre os pes",
  },
  {
    value: "PREENSAO_MANUAL_BOLA_MACIA",
    label: "Preensao com bola macia",
    hint: "Apertar e relaxar sem irritar sintomas",
  },
  {
    value: "MOBILIDADE_TORACICA_ROTACAO_SENTADA",
    label: "Rotacao toracica sentada",
    hint: "Giro controlado do tronco em sedestacao",
  },
  {
    value: "RETRACAO_ESCAPULAR_SENTADA",
    label: "Retracao escapular sentada",
    hint: "Escapulas para tras e para baixo",
  },
  {
    value: "ISOMETRIA_ROTACAO_EXTERNA_OMBRO",
    label: "Isometria de rotacao externa",
    hint: "Pressao leve do dorso da mao contra apoio",
  },
  {
    value: "EXTENSAO_JOELHO_SENTADO",
    label: "Extensao de joelho sentado",
    hint: "Estender o joelho com controle",
  },
  {
    value: "SENTAR_LEVANTAR_CONTROLADO",
    label: "Sentar e levantar",
    hint: "Transferencia funcional com descida lenta",
  },
  {
    value: "ALONGAMENTO_FLEXORES_QUADRIL_MEIO_AJOELHADO",
    label: "Alongamento flexores de quadril",
    hint: "Meio ajoelhado com controle pelvico",
  },
  {
    value: "MARCHA_ESTACIONARIA_APOIO",
    label: "Marcha estacionaria com apoio",
    hint: "Elevar os pes alternadamente com apoio seguro",
  },
  {
    value: "MOBILIDADE_PUNHO_FLEXAO_EXTENSAO",
    label: "Mobilidade de punho",
    hint: "Flexao e extensao ativas em amplitude toleravel",
  },
  {
    value: "ALONGAMENTO_CERVICAL_LATERAL_ASSISTIDO",
    label: "Alongamento cervical lateral",
    hint: "Inclinacao lateral suave sem tracao forte",
  },
  {
    value: "DESLIZAMENTO_NEURAL_MEDIANO",
    label: "Deslizamento neural mediano",
    hint: "Movimento neural leve sem sintomas persistentes",
  },
  {
    value: "PRANCHA_FRONTAL_ANTEBRACO",
    label: "Prancha frontal no antebraco",
    hint: "Alinhamento cabeca-tronco-pelve, cotovelos sob ombros e ausencia de queda lombar",
  },
  {
    value: "BIRD_DOG_EXTENSAO_ALTERNADA",
    label: "Bird-dog / extensao alternada",
    hint: "Coluna neutra, pelve estavel e extensao contralateral clara de braco e perna",
  },
  {
    value: "ELEVACAO_PERNA_RETA",
    label: "Elevacao de perna reta",
    hint: "Perna elevada com joelho estendido, pelve estavel e amplitude moderada",
  },
  {
    value: "ALONGAMENTO_POSTERIOR_COXA_FAIXA",
    label: "Alongamento posterior de coxa com faixa",
    hint: "Faixa no pe, joelho quase estendido e alongamento sem tracao agressiva",
  },
  {
    value: "ALONGAMENTO_PIRIFORME_DECUBITO_DORSAL",
    label: "Alongamento piriforme em decubito dorsal",
    hint: "Posicao tipo figura 4, apoio das maos e ausencia de flexao cervical forcada",
  },
  {
    value: "ELEVACAO_PANTURRILHA_APOIO",
    label: "Elevacao de panturrilha com apoio",
    hint: "Subida controlada dos calcanhares, apoio seguro e tronco alinhado",
  },
  {
    value: "DORSIFLEXAO_TORNOZELO_FAIXA",
    label: "Dorsiflexao de tornozelo com faixa",
    hint: "Faixa no antepe, movimento de dorsiflexao e joelho sem compensacao",
  },
  {
    value: "ROTACAO_EXTERNA_OMBRO_FAIXA",
    label: "Rotacao externa de ombro com faixa",
    hint: "Cotovelo junto ao corpo, ombro relaxado e arco de rotacao externa compreensivel",
  },
  {
    value: "REMADA_SENTADA_FAIXA",
    label: "Remada sentada com faixa",
    hint: "Tronco ereto, escapulas controladas e cotovelos puxando para tras sem elevacao dos ombros",
  },
  {
    value: "ABDUCAO_OMBRO_EM_PE",
    label: "Abducao de ombro em pe",
    hint: "Elevacao lateral ate a linha do ombro, sem compensacao cervical ou elevacao excessiva da escapula",
  },
  {
    value: "MOBILIDADE_TORACICA_QUATRO_APOIOS",
    label: "Mobilidade toracica em quatro apoios",
    hint: "Rotacao toracica clara, pelve estavel e ausencia de carga excessiva cervical",
  },
  {
    value: "DEAD_BUG_CONTROLE_LOMBOPELVICO",
    label: "Dead bug",
    hint: "Controle lombopelvico, braco e perna contralaterais e amplitude segura",
  },
  {
    value: "PRANCHA_LATERAL_JOELHOS_APOIADOS",
    label: "Prancha lateral com joelhos apoiados",
    hint: "Alinhamento lateral e se a posicao dos joelhos esta suficientemente clara",
  },
  {
    value: "CLAMSHELL_ABERTURA_QUADRIL",
    label: "Clamshell / abertura de quadril",
    hint: "Abertura do joelho superior, pes juntos e pelve sem rotacao posterior",
  },
  {
    value: "EXTENSAO_QUADRIL_QUATRO_APOIOS",
    label: "Extensao de quadril em quatro apoios",
    hint: "Ativacao de gluteos, pelve nivelada e ausencia de hiperextensao lombar",
  },
  {
    value: "STEP_UP_BAIXO_APOIO",
    label: "Step-up baixo com apoio",
    hint: "Degrau baixo, apoio seguro e joelho alinhado ao pe",
  },
  {
    value: "AVANCO_ASSISTIDO_CURTO_APOIO",
    label: "Avanco assistido curto com apoio",
    hint: "Amplitude curta, tronco ereto e joelho anterior sem valgo",
  },
  {
    value: "WALL_SLIDE_DESLIZAMENTO_BRACOS",
    label: "Wall slide",
    hint: "Controle escapular, subida dos bracos e ausencia de elevacao compensatoria dos ombros",
  },
  {
    value: "PENDULAR_OMBRO_CODMAN",
    label: "Pendular de ombro / Codman",
    hint: "Braco relaxado, tronco apoiado e movimento pendular pequeno",
  },
  {
    value: "FLEXAO_OMBRO_BASTAO_DECUBITO",
    label: "Flexao de ombro com bastao",
    hint: "Movimento assistido, amplitude confortavel e ausencia de compensacao cervical",
  },
  {
    value: "FLEXAO_EXTENSAO_COTOVELO_HALTER",
    label: "Flexao/extensao de cotovelo com halter",
    hint: "Cotovelo junto ao corpo, ombro relaxado e carga visual leve",
  },
  {
    value: "PRONACAO_SUPINACAO_ANTEBRACO",
    label: "Pronacao/supinacao de antebraco",
    hint: "Apoio do antebraco, cotovelo a 90 graus e rotacao clara da palma",
  },
  {
    value: "OPOSICAO_POLEGAR",
    label: "Oposicao do polegar",
    hint: "Movimento do polegar, punho neutro e clareza para paciente",
  },
  {
    value: "EVERSAO_TORNOZELO_FAIXA",
    label: "Eversao de tornozelo com faixa",
    hint: "Movimento do pe para fora, joelho estavel e faixa bem posicionada",
  },
  {
    value: "ALONGAMENTO_PANTURRILHA_PAREDE",
    label: "Alongamento de panturrilha na parede",
    hint: "Calcanhar posterior no solo, joelho posterior estendido e apoio na parede",
  },
  {
    value: "FLEXAO_JOELHO_EM_PE_APOIO",
    label: "Flexao de joelho em pe com apoio",
    hint: "Flexao do joelho sem compensacao lombar e apoio seguro",
  },
  {
    value: "AGACHAMENTO_ISOMETRICO_PAREDE",
    label: "Agachamento isometrico na parede",
    hint: "Amplitude rasa, costas apoiadas e alinhamento dos joelhos",
  },
  {
    value: "PONTE_COM_MARCHA_ALTERNADA",
    label: "Ponte com marcha alternada",
    hint: "Pelve nivelada, ponte sem hiperextensao e elevacao pequena do joelho",
  },
  {
    value: "ELEVACAO_LATERAL_PERNA_EM_PE",
    label: "Elevacao lateral de perna em pe",
    hint: "Pelve estavel, tronco sem inclinacao e amplitude baixa",
  },
  {
    value: "RESPIRACAO_DIAFRAGMATICA_DECUBITO",
    label: "Respiracao diafragmatica em decubito",
    hint: "Maos em torax/abdome, postura relaxada e destaque no movimento abdominal",
  },
  {
    value: "INCLINACAO_PELVICA_POSTERIOR_DECUBITO",
    label: "Inclinacao pelvica posterior",
    hint: "Controle lombopelvico, joelhos flexionados e movimento sutil da pelve",
  },
  {
    value: "JOELHO_AO_PEITO_UNILATERAL",
    label: "Joelho ao peito unilateral",
    hint: "Alongamento suave, ombros relaxados e ausencia de tracao cervical",
  },
  {
    value: "ROTACAO_LOMBAR_DECUBITO",
    label: "Rotacao lombar em decubito",
    hint: "Joelhos rodando juntos, ombros apoiados e amplitude confortavel",
  },
  {
    value: "ISOMETRIA_QUADRICEPS_TOALHA",
    label: "Isometria de quadriceps com toalha",
    hint: "Toalha sob joelho, pressao para baixo e tornozelo relaxado",
  },
  {
    value: "EXTENSAO_TERMINAL_JOELHO_FAIXA",
    label: "Extensao terminal de joelho com faixa",
    hint: "Faixa atras do joelho, pe apoiado e extensao sem hiperextensao",
  },
  {
    value: "ISOMETRIA_ADUTORES_BOLA",
    label: "Isometria de adutores com bola",
    hint: "Bola entre joelhos, pes apoiados e tronco ereto",
  },
  {
    value: "FLEXAO_PLANTAR_FAIXA",
    label: "Flexao plantar com faixa",
    hint: "Faixa no antepe, movimento para baixo e joelho sem compensacao",
  },
  {
    value: "INVERSAO_TORNOZELO_FAIXA",
    label: "Inversao de tornozelo com faixa",
    hint: "Movimento do pe para dentro e joelho estavel",
  },
  {
    value: "CIRCULOS_TORNOZELO_SENTADO",
    label: "Circulos de tornozelo sentado",
    hint: "Movimento circular no tornozelo, coxa estavel e tronco alinhado",
  },
  {
    value: "EXTENSAO_TORACICA_ENCOSTO_CADEIRA",
    label: "Extensao toracica no encosto",
    hint: "Extensao no torax, nao na lombar, e apoio seguro na cadeira",
  },
  {
    value: "ALONGAMENTO_PEITORAL_PORTA",
    label: "Alongamento peitoral na porta",
    hint: "Antebraco no batente, ombro relaxado e rotacao leve do tronco",
  },
  {
    value: "ISOMETRIA_FLEXAO_OMBRO_PAREDE",
    label: "Isometria de flexao de ombro na parede",
    hint: "Pressao para frente, ombro baixo e tronco neutro",
  },
  {
    value: "ISOMETRIA_ABDUCAO_OMBRO_PAREDE",
    label: "Isometria de abducao de ombro na parede",
    hint: "Pressao lateral, sem elevacao do ombro e sem inclinacao do tronco",
  },
  {
    value: "ROTACAO_INTERNA_OMBRO_FAIXA",
    label: "Rotacao interna de ombro com faixa",
    hint: "Cotovelo junto ao corpo e movimento sem rotacao do tronco",
  },
  {
    value: "EXTENSAO_OMBRO_FAIXA",
    label: "Extensao de ombro com faixa",
    hint: "Puxada para tras, cotovelo estavel e ombro sem encolher",
  },
  {
    value: "REMADA_EM_PE_FAIXA",
    label: "Remada em pe com faixa",
    hint: "Escapulas controladas, cotovelos para tras e postura neutra",
  },
  {
    value: "DESVIO_RADIAL_ULNAR_PUNHO",
    label: "Desvio radial/ulnar de punho",
    hint: "Antebraco apoiado, um unico peso e movimento lateral do punho",
  },
  {
    value: "EXTENSAO_DEDOS_ELASTICO",
    label: "Extensao dos dedos com elastico",
    hint: "Elastico nos dedos, punho neutro e abertura controlada",
  },
  {
    value: "EQUILIBRIO_UNIPODAL_APOIO",
    label: "Equilibrio unipodal com apoio",
    hint: "Apoio leve, pelve nivelada e tronco sem inclinacao",
  },
  {
    value: "DESLIZAMENTO_CALCANHAR_DECUBITO",
    label: "Deslizamento de calcanhar",
    hint: "Calcanhar deslizando no solo, pelve estavel e movimento suave",
  },
  {
    value: "FLEXAO_BRACO_PAREDE",
    label: "Flexao de braco na parede",
    hint: "Alinhamento de tronco, cotovelos e apoio seguro das maos na parede",
  },
  {
    value: "SOCO_SERRATIL_DECUBITO",
    label: "Soco do serratil em decubito",
    hint: "Ombro a 90 graus, cotovelo estendido e movimento de protracao escapular",
  },
  {
    value: "RELOGIO_ESCAPULAR_PAREDE",
    label: "Relogio escapular na parede",
    hint: "Mao apoiada, movimento escapular circular e tronco sem rodar",
  },
  {
    value: "ELEVACAO_PLANO_ESCAPULA_SCAPTION",
    label: "Elevacao no plano da escapula",
    hint: "Elevacao no plano escapular, polegar para cima e ombro sem compensacao",
  },
  {
    value: "EXTENSAO_COTOVELO_FAIXA",
    label: "Extensao de cotovelo com faixa",
    hint: "Cotovelo junto ao corpo, punho neutro e extensao sem elevar o ombro",
  },
  {
    value: "PULL_APART_FAIXA",
    label: "Pull-apart com faixa",
    hint: "Cotovelos estendidos, escapulas controladas e faixa na altura correta",
  },
  {
    value: "ABDUCAO_QUADRIL_FAIXA_JOELHOS",
    label: "Abducao de quadril com faixa",
    hint: "Apoio leve, pelve nivelada e movimento lateral sem inclinacao do tronco",
  },
  {
    value: "CAMINHADA_LATERAL_FAIXA",
    label: "Caminhada lateral com faixa",
    hint: "Joelhos alinhados, quadril ativo e passo lateral controlado",
  },
  {
    value: "DOBRADICA_QUADRIL_BASTAO",
    label: "Dobradica de quadril com bastao",
    hint: "Coluna neutra, movimento partindo do quadril e bastao alinhado",
  },
  {
    value: "STEP_DOWN_BAIXO",
    label: "Step-down baixo",
    hint: "Controle do joelho, apoio seguro e descida lenta do membro livre",
  },
  {
    value: "CAMINHADA_CALCANHARES",
    label: "Caminhada nos calcanhares",
    hint: "Dorsiflexao dos tornozelos, dedos elevados e postura ereta",
  },
  {
    value: "CAMINHADA_PONTA_PES",
    label: "Caminhada na ponta dos pes",
    hint: "Elevacao dos calcanhares, alinhamento dos tornozelos e equilibrio",
  },
  {
    value: "SHORT_FOOT_ARCO_PLANTAR",
    label: "Short foot",
    hint: "Elevacao sutil do arco sem flexionar excessivamente os dedos",
  },
  {
    value: "ENRUGAR_TOALHA_DEDOS_PE",
    label: "Enrugar toalha com dedos",
    hint: "Dedos puxando a toalha, calcanhar apoiado e tornozelo estavel",
  },
  {
    value: "ROTACAO_CERVICAL_SENTADA",
    label: "Rotacao cervical sentada",
    hint: "Movimento apenas da cervical, ombros relaxados e tronco alinhado",
  },
  {
    value: "EXTENSAO_CERVICAL_SENTADA",
    label: "Extensao cervical sentada",
    hint: "Extensao cervical controlada, sem exagero de amplitude ou compensacao toracica",
  },
  {
    value: "MARCHA_SENTADA",
    label: "Marcha sentada",
    hint: "Elevacao alternada do joelho, tronco ereto e apoio estavel na cadeira",
  },
  {
    value: "EXTENSAO_JOELHO_SENTADO_LONGA",
    label: "Extensao de joelho sentado",
    hint: "Extensao do joelho sem travar, coxa apoiada e tornozelo neutro",
  },
  {
    value: "ROTACAO_TRONCO_SENTADA",
    label: "Rotacao de tronco sentada",
    hint: "Rotacao toracica controlada, pelve estavel e pes apoiados",
  },
  {
    value: "APOIO_TANDEM_COM_APOIO",
    label: "Apoio tandem com apoio",
    hint: "Pes em linha, apoio leve da mao e tronco sem inclinacao lateral",
  },
];

const DEFAULT_TYPE: ExerciseImageType = "MOBILIDADE_GERAL";

const EXERCISE_IMAGE_ASSETS: Partial<
  Record<ExerciseImageType, ImageSourcePropType>
> = {
  MOBILIDADE_LOMBAR_GATO_CAMELO: require("../../../assets/exercises/mobilidade-lombar-gato-camelo.jpg"),
  PONTE_CURTA: require("../../../assets/exercises/ponte-curta.jpg"),
  CONTROLE_CERVICAL_PROFUNDO: require("../../../assets/exercises/controle-cervical-profundo.jpg"),
  ELEVACAO_ASSISTIDA_OMBRO: require("../../../assets/exercises/elevacao-assistida-ombro.jpg"),
  AGACHAMENTO_PARCIAL_ASSISTIDO: require("../../../assets/exercises/agachamento-parcial-assistido.jpg"),
  ABDUCAO_QUADRIL_DECUBITO_LATERAL: require("../../../assets/exercises/abducao-quadril-decubito-lateral.jpg"),
  EQUILIBRIO_BIPODAL_TRANSFERENCIA_PESO: require("../../../assets/exercises/equilibrio-bipodal-transferencia-peso.jpg"),
  PREENSAO_MANUAL_BOLA_MACIA: require("../../../assets/exercises/preensao-manual-bola-macia.jpg"),
  MOBILIDADE_TORACICA_ROTACAO_SENTADA: require("../../../assets/exercises/mobilidade-toracica-rotacao-sentada.jpg"),
  RETRACAO_ESCAPULAR_SENTADA: require("../../../assets/exercises/retracao-escapular-sentada.jpg"),
  ISOMETRIA_ROTACAO_EXTERNA_OMBRO: require("../../../assets/exercises/isometria-rotacao-externa-ombro.jpg"),
  EXTENSAO_JOELHO_SENTADO: require("../../../assets/exercises/extensao-joelho-sentado.jpg"),
  SENTAR_LEVANTAR_CONTROLADO: require("../../../assets/exercises/sentar-levantar-controlado.jpg"),
  ALONGAMENTO_FLEXORES_QUADRIL_MEIO_AJOELHADO: require("../../../assets/exercises/alongamento-flexores-quadril-meio-ajoelhado.jpg"),
  MARCHA_ESTACIONARIA_APOIO: require("../../../assets/exercises/marcha-estacionaria-apoio.jpg"),
  MOBILIDADE_PUNHO_FLEXAO_EXTENSAO: require("../../../assets/exercises/mobilidade-punho-flexao-extensao.jpg"),
  ALONGAMENTO_CERVICAL_LATERAL_ASSISTIDO: require("../../../assets/exercises/alongamento-cervical-lateral-assistido.jpg"),
  DESLIZAMENTO_NEURAL_MEDIANO: require("../../../assets/exercises/deslizamento-neural-mediano.jpg"),
  PRANCHA_FRONTAL_ANTEBRACO: require("../../../assets/exercises/prancha-frontal-antebraco.jpg"),
  BIRD_DOG_EXTENSAO_ALTERNADA: require("../../../assets/exercises/bird-dog-extensao-alternada.jpg"),
  ELEVACAO_PERNA_RETA: require("../../../assets/exercises/elevacao-perna-reta.jpg"),
  ALONGAMENTO_POSTERIOR_COXA_FAIXA: require("../../../assets/exercises/alongamento-posterior-coxa-faixa.jpg"),
  ALONGAMENTO_PIRIFORME_DECUBITO_DORSAL: require("../../../assets/exercises/alongamento-piriforme-decubito-dorsal.jpg"),
  ELEVACAO_PANTURRILHA_APOIO: require("../../../assets/exercises/elevacao-panturrilha-apoio.jpg"),
  DORSIFLEXAO_TORNOZELO_FAIXA: require("../../../assets/exercises/dorsiflexao-tornozelo-faixa.jpg"),
  ROTACAO_EXTERNA_OMBRO_FAIXA: require("../../../assets/exercises/rotacao-externa-ombro-faixa.jpg"),
  REMADA_SENTADA_FAIXA: require("../../../assets/exercises/remada-sentada-faixa.jpg"),
  ABDUCAO_OMBRO_EM_PE: require("../../../assets/exercises/abducao-ombro-em-pe.jpg"),
  MOBILIDADE_TORACICA_QUATRO_APOIOS: require("../../../assets/exercises/mobilidade-toracica-quatro-apoios-thread-needle.jpg"),
  DEAD_BUG_CONTROLE_LOMBOPELVICO: require("../../../assets/exercises/dead-bug-controle-lombopelvico.jpg"),
  PRANCHA_LATERAL_JOELHOS_APOIADOS: require("../../../assets/exercises/prancha-lateral-joelhos-apoiados.jpg"),
  CLAMSHELL_ABERTURA_QUADRIL: require("../../../assets/exercises/clamshell-abertura-quadril.jpg"),
  EXTENSAO_QUADRIL_QUATRO_APOIOS: require("../../../assets/exercises/extensao-quadril-quatro-apoios.jpg"),
  STEP_UP_BAIXO_APOIO: require("../../../assets/exercises/step-up-baixo-apoio.jpg"),
  AVANCO_ASSISTIDO_CURTO_APOIO: require("../../../assets/exercises/avanco-assistido-curto-apoio.jpg"),
  WALL_SLIDE_DESLIZAMENTO_BRACOS: require("../../../assets/exercises/wall-slide-deslizamento-bracos-parede.jpg"),
  PENDULAR_OMBRO_CODMAN: require("../../../assets/exercises/pendular-ombro-codman.jpg"),
  FLEXAO_OMBRO_BASTAO_DECUBITO: require("../../../assets/exercises/flexao-ombro-bastao-decubito.jpg"),
  FLEXAO_EXTENSAO_COTOVELO_HALTER: require("../../../assets/exercises/flexao-extensao-cotovelo-halter.jpg"),
  PRONACAO_SUPINACAO_ANTEBRACO: require("../../../assets/exercises/pronacao-supinacao-antebraco.jpg"),
  OPOSICAO_POLEGAR: require("../../../assets/exercises/oposicao-polegar.jpg"),
  EVERSAO_TORNOZELO_FAIXA: require("../../../assets/exercises/eversao-tornozelo-faixa.jpg"),
  ALONGAMENTO_PANTURRILHA_PAREDE: require("../../../assets/exercises/alongamento-panturrilha-parede.jpg"),
  FLEXAO_JOELHO_EM_PE_APOIO: require("../../../assets/exercises/flexao-joelho-em-pe-apoio.jpg"),
  AGACHAMENTO_ISOMETRICO_PAREDE: require("../../../assets/exercises/agachamento-isometrico-parede.jpg"),
  PONTE_COM_MARCHA_ALTERNADA: require("../../../assets/exercises/ponte-com-marcha-alternada.jpg"),
  ELEVACAO_LATERAL_PERNA_EM_PE: require("../../../assets/exercises/elevacao-lateral-perna-em-pe.jpg"),
  RESPIRACAO_DIAFRAGMATICA_DECUBITO: require("../../../assets/exercises/respiracao-diafragmatica-decubito.jpg"),
  INCLINACAO_PELVICA_POSTERIOR_DECUBITO: require("../../../assets/exercises/inclinacao-pelvica-posterior-decubito.jpg"),
  JOELHO_AO_PEITO_UNILATERAL: require("../../../assets/exercises/joelho-ao-peito-unilateral.jpg"),
  ROTACAO_LOMBAR_DECUBITO: require("../../../assets/exercises/rotacao-lombar-decubito.jpg"),
  ISOMETRIA_QUADRICEPS_TOALHA: require("../../../assets/exercises/isometria-quadriceps-toalha.jpg"),
  EXTENSAO_TERMINAL_JOELHO_FAIXA: require("../../../assets/exercises/extensao-terminal-joelho-faixa.jpg"),
  ISOMETRIA_ADUTORES_BOLA: require("../../../assets/exercises/isometria-adutores-bola.jpg"),
  FLEXAO_PLANTAR_FAIXA: require("../../../assets/exercises/flexao-plantar-faixa.jpg"),
  INVERSAO_TORNOZELO_FAIXA: require("../../../assets/exercises/inversao-tornozelo-faixa.jpg"),
  CIRCULOS_TORNOZELO_SENTADO: require("../../../assets/exercises/circulos-tornozelo-sentado.jpg"),
  EXTENSAO_TORACICA_ENCOSTO_CADEIRA: require("../../../assets/exercises/extensao-toracica-encosto-cadeira.jpg"),
  ALONGAMENTO_PEITORAL_PORTA: require("../../../assets/exercises/alongamento-peitoral-porta.jpg"),
  ISOMETRIA_FLEXAO_OMBRO_PAREDE: require("../../../assets/exercises/isometria-flexao-ombro-parede.jpg"),
  ISOMETRIA_ABDUCAO_OMBRO_PAREDE: require("../../../assets/exercises/isometria-abducao-ombro-parede.jpg"),
  ROTACAO_INTERNA_OMBRO_FAIXA: require("../../../assets/exercises/rotacao-interna-ombro-faixa.jpg"),
  EXTENSAO_OMBRO_FAIXA: require("../../../assets/exercises/extensao-ombro-faixa.jpg"),
  REMADA_EM_PE_FAIXA: require("../../../assets/exercises/remada-em-pe-faixa.jpg"),
  DESVIO_RADIAL_ULNAR_PUNHO: require("../../../assets/exercises/desvio-radial-ulnar-punho.jpg"),
  EXTENSAO_DEDOS_ELASTICO: require("../../../assets/exercises/extensao-dedos-elastico.jpg"),
  EQUILIBRIO_UNIPODAL_APOIO: require("../../../assets/exercises/equilibrio-unipodal-apoio.jpg"),
  DESLIZAMENTO_CALCANHAR_DECUBITO: require("../../../assets/exercises/deslizamento-calcanhar-decubito.jpg"),
  FLEXAO_BRACO_PAREDE: require("../../../assets/exercises/flexao-braco-parede.jpg"),
  SOCO_SERRATIL_DECUBITO: require("../../../assets/exercises/soco-serratil-decubito.jpg"),
  RELOGIO_ESCAPULAR_PAREDE: require("../../../assets/exercises/relogio-escapular-parede.jpg"),
  ELEVACAO_PLANO_ESCAPULA_SCAPTION: require("../../../assets/exercises/elevacao-plano-escapula-scaption.jpg"),
  EXTENSAO_COTOVELO_FAIXA: require("../../../assets/exercises/extensao-cotovelo-faixa.jpg"),
  PULL_APART_FAIXA: require("../../../assets/exercises/pull-apart-faixa.jpg"),
  ABDUCAO_QUADRIL_FAIXA_JOELHOS: require("../../../assets/exercises/abducao-quadril-faixa-joelhos.jpg"),
  CAMINHADA_LATERAL_FAIXA: require("../../../assets/exercises/caminhada-lateral-faixa.jpg"),
  DOBRADICA_QUADRIL_BASTAO: require("../../../assets/exercises/dobradica-quadril-bastao.jpg"),
  STEP_DOWN_BAIXO: require("../../../assets/exercises/step-down-baixo.jpg"),
  CAMINHADA_CALCANHARES: require("../../../assets/exercises/caminhada-calcanhares.jpg"),
  CAMINHADA_PONTA_PES: require("../../../assets/exercises/caminhada-ponta-pes.jpg"),
  SHORT_FOOT_ARCO_PLANTAR: require("../../../assets/exercises/short-foot-arco-plantar.jpg"),
  ENRUGAR_TOALHA_DEDOS_PE: require("../../../assets/exercises/enrugar-toalha-dedos-pe.jpg"),
  ROTACAO_CERVICAL_SENTADA: require("../../../assets/exercises/rotacao-cervical-sentada.jpg"),
  EXTENSAO_CERVICAL_SENTADA: require("../../../assets/exercises/extensao-cervical-sentada.jpg"),
  MARCHA_SENTADA: require("../../../assets/exercises/marcha-sentada.jpg"),
  EXTENSAO_JOELHO_SENTADO_LONGA: require("../../../assets/exercises/extensao-joelho-sentado-longa.jpg"),
  ROTACAO_TRONCO_SENTADA: require("../../../assets/exercises/rotacao-tronco-sentada.jpg"),
  APOIO_TANDEM_COM_APOIO: require("../../../assets/exercises/apoio-tandem-com-apoio.jpg"),
};

function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizeExerciseImageType(
  value?: string | null,
): ExerciseImageType {
  const normalized = String(value || "").trim().toUpperCase();
  const match = EXERCISE_IMAGE_OPTIONS.find((item) => item.value === normalized);
  return match?.value || DEFAULT_TYPE;
}

export function inferExerciseImageType(...values: unknown[]): ExerciseImageType {
  const text = normalizeText(values.join(" "));
  const hasAny = (terms: string[]) => terms.some((term) => text.includes(term));

  if (hasAny(["gato", "camelo"])) return "MOBILIDADE_LOMBAR_GATO_CAMELO";
  if (hasAny(["ponte curta", "ponte"])) return "PONTE_CURTA";
  if (hasAny(["cervical profundo", "recolher o queixo", "queixo"])) {
    return "CONTROLE_CERVICAL_PROFUNDO";
  }
  if (hasAny(["alongamento cervical lateral", "cervical lateral"])) {
    return "ALONGAMENTO_CERVICAL_LATERAL_ASSISTIDO";
  }
  if (hasAny(["elevacao assistida", "elevacao de ombro"])) {
    return "ELEVACAO_ASSISTIDA_OMBRO";
  }
  if (hasAny(["retracao escapular", "escapular sentada"])) {
    return "RETRACAO_ESCAPULAR_SENTADA";
  }
  if (hasAny(["rotacao externa", "isometria de rotacao"])) {
    return "ISOMETRIA_ROTACAO_EXTERNA_OMBRO";
  }
  if (hasAny(["agachamento parcial"])) {
    return "AGACHAMENTO_PARCIAL_ASSISTIDO";
  }
  if (hasAny(["extensao de joelho", "joelho sentado"])) {
    return "EXTENSAO_JOELHO_SENTADO";
  }
  if (hasAny(["sentar e levantar", "levantar controlado"])) {
    return "SENTAR_LEVANTAR_CONTROLADO";
  }
  if (hasAny(["abducao de quadril", "decubito lateral"])) {
    return "ABDUCAO_QUADRIL_DECUBITO_LATERAL";
  }
  if (hasAny(["flexores de quadril", "meio ajoelhado"])) {
    return "ALONGAMENTO_FLEXORES_QUADRIL_MEIO_AJOELHADO";
  }
  if (hasAny(["transferencia de peso", "equilibrio bipodal"])) {
    return "EQUILIBRIO_BIPODAL_TRANSFERENCIA_PESO";
  }
  if (hasAny(["marcha estacionaria"])) return "MARCHA_ESTACIONARIA_APOIO";
  if (hasAny(["preensao", "bola macia"])) return "PREENSAO_MANUAL_BOLA_MACIA";
  if (hasAny(["flexao e extensao", "mobilidade de punho"])) {
    return "MOBILIDADE_PUNHO_FLEXAO_EXTENSAO";
  }
  if (hasAny(["deslizamento neural", "neural mediano"])) {
    return "DESLIZAMENTO_NEURAL_MEDIANO";
  }
  if (hasAny(["toracica", "rotacao sentada"])) {
    return "MOBILIDADE_TORACICA_ROTACAO_SENTADA";
  }
  if (hasAny(["ombro", "manguito", "escapul"])) return "OMBRO_MANGUITO";
  if (hasAny(["cervical", "pescoco", "cefaleia"])) return "CONTROLE_CERVICAL";
  if (hasAny(["lombar", "lombo", "ciatic", "lombalgia"])) {
    return "MOBILIDADE_LOMBAR";
  }
  if (hasAny(["joelho", "patelar", "quadriceps", "agachamento"])) {
    return "JOELHO_AGACHAMENTO";
  }
  if (hasAny(["quadril", "coxofemoral", "gluteo"])) return "QUADRIL_GLUTEOS";
  if (hasAny(["tornozelo", "apoio", "equilibrio", "propriocepcao"])) {
    return "TORNOZELO_EQUILIBRIO";
  }
  if (hasAny(["punho", "mao", "carpal", "preensao", "cotovelo"])) {
    return "PUNHO_PREENSAO";
  }
  return DEFAULT_TYPE;
}

function Pose({ type }: { type: ExerciseImageType }) {
  const stroke = COLORS.primary;
  const accent = COLORS.secondary;
  const muted = COLORS.gray400;

  if (type === "MOBILIDADE_LOMBAR_GATO_CAMELO") {
    return (
      <>
        <Circle
          cx="44"
          cy="70"
          r="9"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Path
          d="M54 76 C76 58 104 58 124 76"
          stroke={stroke}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
        />
        <Line
          x1="64"
          y1="84"
          x2="54"
          y2="126"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="108"
          y1="84"
          x2="118"
          y2="126"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="58"
          y1="126"
          x2="42"
          y2="138"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="118"
          y1="126"
          x2="134"
          y2="138"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Path
          d="M70 48 C84 34 104 34 118 48"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M70 100 C84 114 104 114 118 100"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "PONTE_CURTA") {
    return (
      <>
        <Circle
          cx="40"
          cy="100"
          r="9"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="50"
          y1="100"
          x2="84"
          y2="78"
          stroke={stroke}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Line
          x1="84"
          y1="78"
          x2="118"
          y2="102"
          stroke={stroke}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Line
          x1="118"
          y1="102"
          x2="142"
          y2="102"
          stroke={muted}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="62"
          y1="112"
          x2="118"
          y2="112"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Path
          d="M74 92 C82 72 92 62 106 58"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "CONTROLE_CERVICAL_PROFUNDO") {
    return (
      <>
        <Circle
          cx="86"
          cy="35"
          r="11"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="86"
          y1="48"
          x2="86"
          y2="96"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="58"
          y1="62"
          x2="112"
          y2="62"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="86"
          y1="96"
          x2="64"
          y2="136"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="86"
          y1="96"
          x2="108"
          y2="136"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M108 36 H86"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M92 30 L84 36 L92 42"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    );
  }

  if (type === "ELEVACAO_ASSISTIDA_OMBRO") {
    return (
      <>
        <Circle
          cx="82"
          cy="31"
          r="10"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="82"
          y1="44"
          x2="82"
          y2="96"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="82"
          y1="58"
          x2="50"
          y2="78"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="82"
          y1="58"
          x2="110"
          y2="24"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="54"
          y1="82"
          x2="112"
          y2="22"
          stroke={muted}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Line
          x1="82"
          y1="96"
          x2="58"
          y2="136"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="82"
          y1="96"
          x2="106"
          y2="136"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "AGACHAMENTO_PARCIAL_ASSISTIDO") {
    return (
      <>
        <Pose type="JOELHO_AGACHAMENTO" />
        <Line
          x1="145"
          y1="44"
          x2="145"
          y2="142"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="122"
          y1="70"
          x2="145"
          y2="70"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "ABDUCAO_QUADRIL_DECUBITO_LATERAL") {
    return (
      <>
        <Circle
          cx="38"
          cy="106"
          r="9"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="48"
          y1="106"
          x2="94"
          y2="106"
          stroke={stroke}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Line
          x1="94"
          y1="106"
          x2="138"
          y2="126"
          stroke={muted}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="94"
          y1="104"
          x2="134"
          y2="72"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M102 98 C112 82 124 72 142 66"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="4 5"
        />
      </>
    );
  }

  if (type === "EQUILIBRIO_BIPODAL_TRANSFERENCIA_PESO") {
    return (
      <>
        <Pose type="TORNOZELO_EQUILIBRIO" />
        <Path
          d="M48 122 H122"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M58 114 L46 122 L58 130"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M112 114 L124 122 L112 130"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    );
  }

  if (type === "PREENSAO_MANUAL_BOLA_MACIA") {
    return (
      <>
        <Pose type="PUNHO_PREENSAO" />
        <Path
          d="M124 88 C132 80 144 82 148 94"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M124 88 C132 98 144 100 148 94"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "MOBILIDADE_TORACICA_ROTACAO_SENTADA") {
    return (
      <>
        <Circle
          cx="82"
          cy="30"
          r="10"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="82"
          y1="44"
          x2="82"
          y2="98"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="54"
          y1="62"
          x2="110"
          y2="62"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="82"
          y1="98"
          x2="58"
          y2="132"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="82"
          y1="98"
          x2="110"
          y2="132"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Rect x="44" y="132" width="82" height="8" rx="4" fill={muted} />
        <Path
          d="M52 78 C72 52 112 52 132 78"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M124 66 L134 78 L120 84"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    );
  }

  if (type === "RETRACAO_ESCAPULAR_SENTADA") {
    return (
      <>
        <Pose type="OMBRO_MANGUITO" />
        <Path
          d="M62 62 H82"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Path
          d="M104 62 H84"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Path
          d="M72 54 L82 62 L72 70"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M94 54 L84 62 L94 70"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    );
  }

  if (type === "ISOMETRIA_ROTACAO_EXTERNA_OMBRO") {
    return (
      <>
        <Circle
          cx="66"
          cy="30"
          r="10"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="66"
          y1="44"
          x2="66"
          y2="98"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="66"
          y1="58"
          x2="98"
          y2="58"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="98"
          y1="58"
          x2="98"
          y2="82"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="116"
          y1="34"
          x2="116"
          y2="132"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Path
          d="M102 82 H116"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <Line
          x1="66"
          y1="98"
          x2="46"
          y2="136"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="66"
          y1="98"
          x2="86"
          y2="136"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "EXTENSAO_JOELHO_SENTADO") {
    return (
      <>
        <Circle
          cx="70"
          cy="34"
          r="10"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="70"
          y1="48"
          x2="70"
          y2="96"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Rect x="44" y="96" width="58" height="10" rx="4" fill={muted} />
        <Line
          x1="68"
          y1="96"
          x2="96"
          y2="116"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="96"
          y1="116"
          x2="138"
          y2="116"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="54"
          y1="106"
          x2="54"
          y2="140"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Path
          d="M104 104 L140 116 L104 128"
          stroke={accent}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    );
  }

  if (type === "SENTAR_LEVANTAR_CONTROLADO") {
    return (
      <>
        <Circle
          cx="86"
          cy="34"
          r="10"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="86"
          y1="48"
          x2="72"
          y2="94"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="72"
          y1="94"
          x2="104"
          y2="116"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="104"
          y1="116"
          x2="126"
          y2="140"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Rect x="36" y="96" width="48" height="10" rx="4" fill={muted} />
        <Line
          x1="42"
          y1="106"
          x2="42"
          y2="140"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Path
          d="M116 72 C132 84 138 102 134 120"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "ALONGAMENTO_FLEXORES_QUADRIL_MEIO_AJOELHADO") {
    return (
      <>
        <Circle
          cx="72"
          cy="34"
          r="10"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="72"
          y1="48"
          x2="76"
          y2="88"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="76"
          y1="88"
          x2="48"
          y2="124"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="48"
          y1="124"
          x2="34"
          y2="140"
          stroke={muted}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="76"
          y1="88"
          x2="114"
          y2="108"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="114"
          y1="108"
          x2="142"
          y2="108"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M86 82 C98 70 110 68 124 72"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "MARCHA_ESTACIONARIA_APOIO") {
    return (
      <>
        <Circle
          cx="74"
          cy="30"
          r="10"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="74"
          y1="44"
          x2="74"
          y2="92"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="74"
          y1="58"
          x2="110"
          y2="58"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="122"
          y1="40"
          x2="122"
          y2="140"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="74"
          y1="92"
          x2="68"
          y2="140"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="74"
          y1="92"
          x2="104"
          y2="104"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="104"
          y1="104"
          x2="102"
          y2="130"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M96 94 C104 82 112 80 120 88"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (type === "MOBILIDADE_PUNHO_FLEXAO_EXTENSAO") {
    return (
      <>
        <Line
          x1="34"
          y1="96"
          x2="100"
          y2="96"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <Line
          x1="100"
          y1="96"
          x2="136"
          y2="78"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="100"
          y1="96"
          x2="136"
          y2="114"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.55"
        />
        <Rect x="28" y="104" width="76" height="8" rx="4" fill={muted} />
        <Path
          d="M128 64 C144 80 144 112 128 128"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M126 64 L138 66 L136 78"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M126 128 L138 126 L136 114"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    );
  }

  if (type === "ALONGAMENTO_CERVICAL_LATERAL_ASSISTIDO") {
    return (
      <>
        <Circle
          cx="92"
          cy="35"
          r="11"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="84"
          y1="48"
          x2="78"
          y2="96"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="56"
          y1="64"
          x2="104"
          y2="64"
          stroke={muted}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="78"
          y1="96"
          x2="58"
          y2="136"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="78"
          y1="96"
          x2="100"
          y2="136"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M106 30 C112 44 108 58 96 66"
          stroke={accent}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M86 22 C70 30 64 44 70 60"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="4 5"
        />
      </>
    );
  }

  if (type === "DESLIZAMENTO_NEURAL_MEDIANO") {
    return (
      <>
        <Circle
          cx="58"
          cy="38"
          r="10"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
        />
        <Line
          x1="58"
          y1="52"
          x2="58"
          y2="104"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="58"
          y1="66"
          x2="112"
          y2="56"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="112"
          y1="56"
          x2="142"
          y2="48"
          stroke={accent}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Line
          x1="58"
          y1="104"
          x2="40"
          y2="140"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Line
          x1="58"
          y1="104"
          x2="80"
          y2="140"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M112 42 C126 32 140 34 150 46"
          stroke={accent}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="4 5"
        />
      </>
    );
  }

  if (type === "JOELHO_AGACHAMENTO") {
    return (
      <>
        <Circle cx="84" cy="30" r="10" fill="none" stroke={stroke} strokeWidth="4" />
        <Line x1="84" y1="42" x2="76" y2="84" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="76" y1="84" x2="110" y2="102" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="110" y1="102" x2="138" y2="126" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="78" y1="82" x2="42" y2="110" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="42" y1="110" x2="28" y2="138" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="76" y1="56" x2="42" y2="70" stroke={muted} strokeWidth="4" strokeLinecap="round" />
        <Line x1="86" y1="58" x2="120" y2="72" stroke={muted} strokeWidth="4" strokeLinecap="round" />
        <Path d="M96 101 C108 92 122 93 136 103" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" />
      </>
    );
  }

  if (type === "OMBRO_MANGUITO") {
    return (
      <>
        <Circle cx="82" cy="28" r="10" fill="none" stroke={stroke} strokeWidth="4" />
        <Line x1="82" y1="42" x2="82" y2="96" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="82" y1="56" x2="42" y2="34" stroke={accent} strokeWidth="6" strokeLinecap="round" />
        <Line x1="82" y1="56" x2="122" y2="34" stroke={accent} strokeWidth="6" strokeLinecap="round" />
        <Line x1="82" y1="96" x2="58" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="82" y1="96" x2="106" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Path d="M36 64 C56 50 108 50 128 64" stroke={muted} strokeWidth="3" fill="none" strokeDasharray="4 6" />
      </>
    );
  }

  if (type === "CONTROLE_CERVICAL") {
    return (
      <>
        <Circle cx="84" cy="28" r="10" fill="none" stroke={stroke} strokeWidth="4" />
        <Line x1="84" y1="42" x2="84" y2="94" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="60" y1="58" x2="108" y2="58" stroke={muted} strokeWidth="5" strokeLinecap="round" />
        <Line x1="84" y1="94" x2="62" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="84" y1="94" x2="106" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Path d="M67 32 C78 18 92 18 102 32" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" />
        <Path d="M56 48 C70 40 98 40 112 48" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" />
      </>
    );
  }

  if (type === "MOBILIDADE_LOMBAR") {
    return (
      <>
        <Circle cx="80" cy="30" r="10" fill="none" stroke={stroke} strokeWidth="4" />
        <Path d="M82 44 C68 58 66 78 80 96" stroke={stroke} strokeWidth="7" fill="none" strokeLinecap="round" />
        <Line x1="78" y1="62" x2="44" y2="82" stroke={muted} strokeWidth="4" strokeLinecap="round" />
        <Line x1="80" y1="96" x2="52" y2="134" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="82" y1="96" x2="112" y2="134" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Path d="M96 74 C118 82 128 98 126 120" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" />
      </>
    );
  }

  if (type === "QUADRIL_GLUTEOS") {
    return (
      <>
        <Circle cx="78" cy="28" r="10" fill="none" stroke={stroke} strokeWidth="4" />
        <Line x1="78" y1="42" x2="78" y2="86" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="78" y1="86" x2="44" y2="128" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="78" y1="86" x2="118" y2="112" stroke={accent} strokeWidth="6" strokeLinecap="round" />
        <Line x1="118" y1="112" x2="142" y2="112" stroke={accent} strokeWidth="6" strokeLinecap="round" />
        <Line x1="60" y1="58" x2="104" y2="58" stroke={muted} strokeWidth="5" strokeLinecap="round" />
      </>
    );
  }

  if (type === "TORNOZELO_EQUILIBRIO") {
    return (
      <>
        <Circle cx="82" cy="28" r="10" fill="none" stroke={stroke} strokeWidth="4" />
        <Line x1="82" y1="42" x2="82" y2="88" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="82" y1="58" x2="50" y2="70" stroke={muted} strokeWidth="5" strokeLinecap="round" />
        <Line x1="82" y1="58" x2="116" y2="46" stroke={muted} strokeWidth="5" strokeLinecap="round" />
        <Line x1="82" y1="88" x2="76" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="76" y1="136" x2="104" y2="140" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Path d="M44 146 C70 134 100 134 126 146" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" />
      </>
    );
  }

  if (type === "PUNHO_PREENSAO") {
    return (
      <>
        <Circle cx="70" cy="30" r="10" fill="none" stroke={stroke} strokeWidth="4" />
        <Line x1="70" y1="44" x2="70" y2="94" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="70" y1="58" x2="116" y2="80" stroke={accent} strokeWidth="6" strokeLinecap="round" />
        <Circle cx="132" cy="88" r="12" fill="none" stroke={accent} strokeWidth="4" />
        <Line x1="70" y1="94" x2="48" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Line x1="70" y1="94" x2="92" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        <Path d="M120 70 C134 74 142 82 146 96" stroke={muted} strokeWidth="3" fill="none" strokeDasharray="4 5" />
      </>
    );
  }

  return (
    <>
      <Circle cx="82" cy="28" r="10" fill="none" stroke={stroke} strokeWidth="4" />
      <Line x1="82" y1="42" x2="82" y2="92" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
      <Line x1="82" y1="58" x2="48" y2="82" stroke={muted} strokeWidth="5" strokeLinecap="round" />
      <Line x1="82" y1="58" x2="116" y2="82" stroke={muted} strokeWidth="5" strokeLinecap="round" />
      <Line x1="82" y1="92" x2="56" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
      <Line x1="82" y1="92" x2="108" y2="136" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
      <Path d="M42 112 C62 100 102 100 122 112" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  );
}

type Props = {
  imageType?: string | null;
  title?: string | null;
  compact?: boolean;
};

export function ExerciseVisual({ imageType, compact }: Props) {
  const resolvedType = useMemo(
    () => (imageType ? normalizeExerciseImageType(imageType) : DEFAULT_TYPE),
    [imageType],
  );
  const option =
    EXERCISE_IMAGE_OPTIONS.find((item) => item.value === resolvedType) ||
    EXERCISE_IMAGE_OPTIONS[0];
  const asset = EXERCISE_IMAGE_ASSETS[resolvedType];

  if (asset) {
    return (
      <View
        style={[
          styles.frame,
          styles.generatedFrame,
          styles.rasterFrame,
          compact && styles.frameCompact,
        ]}
      >
        <Image source={asset} style={styles.exerciseImage} resizeMode="contain" />
        <Text style={[styles.watermark, compact && styles.watermarkCompact]}>
          Synap
        </Text>
        {!compact ? (
          <View style={styles.caption}>
            <Text style={styles.captionTitle}>{option.label}</Text>
            <Text style={styles.captionHint}>{option.hint}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.frame, styles.generatedFrame, compact && styles.frameCompact]}>
      <Svg width="100%" height="100%" viewBox="0 0 168 168">
        <Rect x="8" y="8" width="152" height="152" rx="18" fill="#F7FBFA" />
        <Path d="M24 140 H144" stroke={COLORS.gray300} strokeWidth="5" strokeLinecap="round" />
        <Pose type={resolvedType} />
        <SvgText
          x="132"
          y="151"
          fill={COLORS.gray400}
          fontSize="11"
          fontWeight="700"
          opacity="0.72"
          textAnchor="middle"
        >
          Synap
        </SvgText>
      </Svg>
      {!compact ? (
        <View style={styles.caption}>
          <Text style={styles.captionTitle}>{option.label}</Text>
          <Text style={styles.captionHint}>{option.hint}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    height: 172,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
    backgroundColor: COLORS.gray100,
  },
  frameCompact: {
    width: 74,
    height: 74,
  },
  generatedFrame: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  rasterFrame: {
    height: 220,
    backgroundColor: "#F7FBFA",
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
  },
  watermark: {
    position: "absolute",
    right: SPACING.sm,
    bottom: 66,
    color: COLORS.gray400,
    fontSize: 11,
    fontWeight: "700",
    opacity: 0.5,
  },
  watermarkCompact: {
    right: 6,
    bottom: 4,
    fontSize: 9,
  },
  caption: {
    position: "absolute",
    left: SPACING.sm,
    right: SPACING.sm,
    bottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: "#FFFFFFE8",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  captionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  captionHint: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
});
