import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExerciseCatalog1780700000000 implements MigrationInterface {
  name = 'CreateExerciseCatalog1780700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exercicios" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nome" varchar(140) NOT NULL,
        "slug" varchar(160) NOT NULL,
        "regiao_corporal" varchar(80) NOT NULL,
        "categoria" varchar(80) NOT NULL,
        "nivel" varchar(40) NOT NULL,
        "objetivo" text NOT NULL,
        "descricao" text,
        "instrucoes_padrao" text NOT NULL,
        "cuidados" text,
        "contraindicacoes" text,
        "imagem_key" varchar(120),
        "tags" jsonb NOT NULL DEFAULT '[]',
        "status" varchar(30) NOT NULL DEFAULT 'APROVADO',
        "versao" int NOT NULL DEFAULT 1,
        "revisado_por_usuario_id" uuid,
        "revisado_em" timestamp,
        "ativo" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exercicios" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_EXERCICIO_SLUG" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_EXERCICIO_FILTROS"
      ON "exercicios" ("regiao_corporal", "categoria", "nivel")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exercicio_midias" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "exercicio_id" uuid NOT NULL,
        "asset_key" varchar(120) NOT NULL,
        "tipo" varchar(40) NOT NULL,
        "source_type" varchar(40) NOT NULL,
        "source_url" text,
        "author" varchar(140),
        "license" varchar(80) NOT NULL,
        "license_url" text,
        "attribution_text" text,
        "versao" int NOT NULL DEFAULT 1,
        "revisado_por_usuario_id" uuid,
        "revisado_em" timestamp,
        "ativo" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exercicio_midias" PRIMARY KEY ("id"),
        CONSTRAINT "FK_exercicio_midias_exercicio"
          FOREIGN KEY ("exercicio_id") REFERENCES "exercicios"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_EXERCICIO_MIDIA_EXERCICIO"
      ON "exercicio_midias" ("exercicio_id", "ativo")
    `);

    await queryRunner.query(`
      ALTER TABLE "atividades"
      ADD COLUMN IF NOT EXISTS "exercicio_id" uuid
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ATIVIDADES_EXERCICIO"
      ON "atividades" ("exercicio_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_atividades_exercicio'
        ) THEN
          ALTER TABLE "atividades"
          ADD CONSTRAINT "FK_atividades_exercicio"
          FOREIGN KEY ("exercicio_id") REFERENCES "exercicios"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await this.seedExercise(
      queryRunner,
      '11111111-1111-4111-8111-111111111111',
      'Mobilidade lombar em gato-camelo',
      'mobilidade-lombar-gato-camelo',
      'LOMBAR',
      'MOBILIDADE',
      'INICIANTE',
      'Reduzir rigidez lombar e melhorar controle lombo-pelvico.',
      'Movimento suave alternando flexao e extensao da coluna em quatro apoios.',
      '1. Fique em quatro apoios, com maos abaixo dos ombros e joelhos abaixo do quadril.\n2. Arredonde lentamente a coluna e depois retorne levando o peito levemente para frente.\n3. Mantenha o movimento lento, sem prender a respiracao.\n4. Pare se houver dor irradiada, formigamento ou piora sustentada.',
      'Evitar amplitudes forcadas. Priorizar conforto, respiracao e controle.',
      'Suspender em caso de dor neurologica progressiva, perda de forca ou tontura.',
      'MOBILIDADE_LOMBAR',
      ['lombar', 'mobilidade', 'controle_motor', 'dor_lombar'],
    );
    await this.seedExercise(
      queryRunner,
      '22222222-2222-4222-8222-222222222222',
      'Ponte curta',
      'ponte-curta',
      'LOMBAR_QUADRIL',
      'FORTALECIMENTO',
      'INICIANTE',
      'Ativar gluteos e cadeia posterior com baixa carga.',
      'Elevacao curta do quadril em decubito dorsal, mantendo controle do tronco.',
      '1. Deite de barriga para cima com joelhos dobrados e pes apoiados.\n2. Contraia levemente o abdome e eleve o quadril ate alinhar tronco e coxas.\n3. Desca devagar, mantendo joelhos alinhados.\n4. Interrompa se a dor lombar aumentar ou permanecer apos o exercicio.',
      'Evitar hiperextensao lombar e empurrar com excesso pelo pescoco.',
      'Nao executar se houver dor intensa, piora neurologica ou orientacao profissional contraria.',
      'MOBILIDADE_LOMBAR',
      ['lombar', 'quadril', 'gluteos', 'fortalecimento'],
    );
    await this.seedExercise(
      queryRunner,
      '33333333-3333-4333-8333-333333333333',
      'Controle cervical profundo',
      'controle-cervical-profundo',
      'CERVICAL',
      'CONTROLE_MOTOR',
      'INICIANTE',
      'Melhorar controle cervical e reduzir sobrecarga postural.',
      'Movimento pequeno de recolher o queixo, mantendo coluna cervical alinhada.',
      '1. Sente ou deite com a cabeca apoiada e ombros relaxados.\n2. Recolha suavemente o queixo, como se fizesse um pequeno sim para tras.\n3. Segure por poucos segundos e relaxe.\n4. Nao force amplitude e pare se houver tontura, nausea ou dor irradiada.',
      'Movimento deve ser pequeno e sem compensar com ombros.',
      'Evitar em crise vestibular, tontura importante ou sintomas neurologicos novos.',
      'CONTROLE_CERVICAL',
      ['cervical', 'postura', 'controle_motor', 'pescoco'],
    );
    await this.seedExercise(
      queryRunner,
      '44444444-4444-4444-8444-444444444444',
      'Elevacao assistida de ombro',
      'elevacao-assistida-ombro',
      'OMBRO',
      'MOBILIDADE',
      'INICIANTE',
      'Manter mobilidade de ombro em amplitude toleravel.',
      'Elevacao do braco com apoio da outra mao ou bastao, respeitando dor.',
      '1. Segure o braco afetado com apoio da outra mao ou de um bastao.\n2. Eleve o braco lentamente ate uma amplitude confortavel.\n3. Retorne devagar, mantendo escapula controlada.\n4. Nao ultrapasse dor forte ou sensacao de travamento.',
      'Evitar compensar elevando o ombro em direcao a orelha.',
      'Evitar em luxacao recente, fratura nao liberada ou dor aguda intensa.',
      'OMBRO_MANGUITO',
      ['ombro', 'mobilidade', 'manguito', 'escapula'],
    );
    await this.seedExercise(
      queryRunner,
      '55555555-5555-4555-8555-555555555555',
      'Agachamento parcial assistido',
      'agachamento-parcial-assistido',
      'JOELHO',
      'FORTALECIMENTO',
      'INICIANTE',
      'Treinar controle de joelho e quadril em cadeia cinetica fechada.',
      'Agachamento curto com apoio, mantendo joelhos alinhados e carga toleravel.',
      '1. Fique em pe com apoio seguro a frente.\n2. Flexione joelhos e quadris apenas ate uma amplitude confortavel.\n3. Mantenha joelhos apontando para a linha dos pes.\n4. Suba devagar e pare se houver dor forte ou instabilidade.',
      'Nao deixar joelho cair para dentro. Evitar velocidade alta.',
      'Evitar em dor aguda alta, bloqueio articular ou instabilidade importante.',
      'JOELHO_AGACHAMENTO',
      ['joelho', 'agachamento', 'quadriceps', 'controle_valgo'],
    );
    await this.seedExercise(
      queryRunner,
      '66666666-6666-4666-8666-666666666666',
      'Abducao de quadril em decubito lateral',
      'abducao-quadril-decubito-lateral',
      'QUADRIL',
      'FORTALECIMENTO',
      'INICIANTE',
      'Ativar gluteo medio e melhorar controle pelvico.',
      'Elevacao lateral da perna com tronco alinhado e pelve estavel.',
      '1. Deite de lado com a perna de baixo flexionada para estabilidade.\n2. Eleve a perna de cima sem rodar o quadril para tras.\n3. Desca lentamente mantendo controle.\n4. Pare se houver dor lateral intensa ou compensacao lombar.',
      'Manter pe apontado para frente e pelve estavel.',
      'Evitar em dor aguda no quadril ou irritacao importante na regiao lateral.',
      'QUADRIL_GLUTEOS',
      ['quadril', 'gluteo_medio', 'pelve', 'fortalecimento'],
    );
    await this.seedExercise(
      queryRunner,
      '77777777-7777-4777-8777-777777777777',
      'Equilibrio bipodal com transferencia de peso',
      'equilibrio-bipodal-transferencia-peso',
      'TORNOZELO',
      'PROPRIOCEPCAO',
      'INICIANTE',
      'Melhorar controle de apoio e estabilidade distal.',
      'Transferencia lenta de peso entre os pes mantendo postura e apoio seguro.',
      '1. Fique em pe perto de uma parede ou bancada.\n2. Transfira o peso lentamente de um pe para o outro.\n3. Mantenha tronco alinhado e respire normalmente.\n4. Interrompa se houver instabilidade, dor forte ou medo de queda.',
      'Executar com apoio por perto e sem fechar os olhos no inicio.',
      'Evitar sem supervisao em alto risco de queda ou tontura importante.',
      'TORNOZELO_EQUILIBRIO',
      ['tornozelo', 'equilibrio', 'propriocepcao', 'apoio'],
    );
    await this.seedExercise(
      queryRunner,
      '88888888-8888-4888-8888-888888888888',
      'Preensao manual com bola macia',
      'preensao-manual-bola-macia',
      'PUNHO_MAO',
      'FORTALECIMENTO',
      'INICIANTE',
      'Melhorar forca de preensao e tolerancia de carga distal.',
      'Apertar uma bola macia com controle, sem aumentar sintomas persistentes.',
      '1. Segure uma bola macia na palma da mao.\n2. Aperte gradualmente por poucos segundos e relaxe.\n3. Mantenha punho neutro e ombro relaxado.\n4. Pare se houver formigamento, perda de forca ou dor persistente.',
      'Usar baixa intensidade no inicio e evitar prender a respiracao.',
      'Evitar em inflamacao aguda intensa ou compressao neural sem liberacao.',
      'PUNHO_PREENSAO',
      ['punho', 'mao', 'preensao', 'fortalecimento'],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "atividades"
      DROP CONSTRAINT IF EXISTS "FK_atividades_exercicio"
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ATIVIDADES_EXERCICIO"`);
    await queryRunner.query(`
      ALTER TABLE "atividades"
      DROP COLUMN IF EXISTS "exercicio_id"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "exercicio_midias"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exercicios"`);
  }

  private async seedExercise(
    queryRunner: QueryRunner,
    id: string,
    nome: string,
    slug: string,
    regiaoCorporal: string,
    categoria: string,
    nivel: string,
    objetivo: string,
    descricao: string,
    instrucoesPadrao: string,
    cuidados: string,
    contraindicacoes: string,
    imagemKey: string,
    tags: string[],
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
        id,
        nome,
        slug,
        regiaoCorporal,
        categoria,
        nivel,
        objetivo,
        descricao,
        instrucoesPadrao,
        cuidados,
        contraindicacoes,
        imagemKey,
        JSON.stringify(tags),
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
      [slug, imagemKey],
    );
  }
}
