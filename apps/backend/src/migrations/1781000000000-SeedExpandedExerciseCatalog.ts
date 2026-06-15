import { MigrationInterface, QueryRunner } from 'typeorm';

type ExerciseSeedRow = {
  id: string;
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
};

export class SeedExpandedExerciseCatalog1781000000000 implements MigrationInterface {
  name = 'SeedExpandedExerciseCatalog1781000000000';

  private readonly exercises: ExerciseSeedRow[] = [
    {
      id: '99999999-9999-4999-8999-999999999999',
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
      imagemKey: 'MOBILIDADE_GERAL',
      tags: ['toracica', 'mobilidade', 'postura', 'rotacao'],
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
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
      cuidados:
        'Nao elevar os ombros em direcao as orelhas durante a retracao.',
      contraindicacoes:
        'Evitar em dor aguda intensa no ombro ou sintomas neurologicos progressivos.',
      imagemKey: 'OMBRO_MANGUITO',
      tags: ['ombro', 'escapula', 'postura', 'controle_motor'],
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
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
      imagemKey: 'OMBRO_MANGUITO',
      tags: ['ombro', 'manguito', 'isometria', 'rotacao_externa'],
    },
    {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
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
      imagemKey: 'JOELHO_AGACHAMENTO',
      tags: ['joelho', 'quadriceps', 'fortalecimento', 'controle_motor'],
    },
    {
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
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
      imagemKey: 'JOELHO_AGACHAMENTO',
      tags: ['joelho', 'quadril', 'funcional', 'sentar_levantar'],
    },
    {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
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
      imagemKey: 'QUADRIL_GLUTEOS',
      tags: ['quadril', 'flexores_quadril', 'mobilidade', 'pelve'],
    },
    {
      id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
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
      imagemKey: 'TORNOZELO_EQUILIBRIO',
      tags: ['tornozelo', 'equilibrio', 'marcha', 'apoio'],
    },
    {
      id: '12121212-1212-4212-8212-121212121212',
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
      imagemKey: 'PUNHO_PREENSAO',
      tags: ['punho', 'mao', 'mobilidade', 'flexao_extensao'],
    },
    {
      id: '13131313-1313-4313-8313-131313131313',
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
      imagemKey: 'CONTROLE_CERVICAL',
      tags: ['cervical', 'alongamento', 'postura', 'pescoco'],
    },
    {
      id: '14141414-1414-4414-8414-141414141414',
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
      imagemKey: 'PUNHO_PREENSAO',
      tags: ['punho', 'mao', 'neural', 'mediano'],
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const exercise of this.exercises) {
      await this.seedExercise(queryRunner, exercise);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const exercise of this.exercises) {
      await queryRunner.query(`DELETE FROM "exercicios" WHERE "slug" = $1`, [
        exercise.slug,
      ]);
    }
  }

  private async seedExercise(
    queryRunner: QueryRunner,
    exercise: ExerciseSeedRow,
  ): Promise<void> {
    await queryRunner.query(
      `
        INSERT INTO "exercicios" (
          "id", "nome", "slug", "regiao_corporal", "categoria", "nivel",
          "objetivo", "descricao", "instrucoes_padrao", "cuidados",
          "contraindicacoes", "imagem_key", "tags", "status", "versao",
          "revisado_em", "ativo"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb,
          'APROVADO', 1, now(), true)
        ON CONFLICT ("slug") DO NOTHING
      `,
      [
        exercise.id,
        exercise.nome,
        exercise.slug,
        exercise.regiaoCorporal,
        exercise.categoria,
        exercise.nivel,
        exercise.objetivo,
        exercise.descricao,
        exercise.instrucoesPadrao,
        exercise.cuidados,
        exercise.contraindicacoes,
        exercise.imagemKey,
        JSON.stringify(exercise.tags),
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "exercicio_midias" (
          "exercicio_id", "asset_key", "tipo", "source_type", "author",
          "license", "attribution_text", "versao", "revisado_em", "ativo"
        )
        SELECT "id", $2::varchar, 'ILUSTRACAO', 'PROPRIA', 'Synap',
          'PROPRIETARIA_SYNAP', 'Ilustracao propria Synap.', 1, now(), true
        FROM "exercicios"
        WHERE "slug" = $1
          AND NOT EXISTS (
            SELECT 1 FROM "exercicio_midias"
            WHERE "exercicio_id" = "exercicios"."id"
              AND "asset_key" = $2::varchar
          )
      `,
      [exercise.slug, exercise.imagemKey],
    );
  }
}
