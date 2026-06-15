import { MigrationInterface, QueryRunner } from 'typeorm';

type ExerciseImageMapping = {
  slug: string;
  genericKey: string;
  specificKey: string;
};

export class ExpandExerciseSpecificImageTypes1781100000000 implements MigrationInterface {
  name = 'ExpandExerciseSpecificImageTypes1781100000000';

  private readonly legacyImageTypes = [
    'MOBILIDADE_GERAL',
    'MOBILIDADE_LOMBAR',
    'CONTROLE_CERVICAL',
    'OMBRO_MANGUITO',
    'JOELHO_AGACHAMENTO',
    'QUADRIL_GLUTEOS',
    'TORNOZELO_EQUILIBRIO',
    'PUNHO_PREENSAO',
  ];

  private readonly specificImageTypes = [
    'MOBILIDADE_LOMBAR_GATO_CAMELO',
    'PONTE_CURTA',
    'CONTROLE_CERVICAL_PROFUNDO',
    'ELEVACAO_ASSISTIDA_OMBRO',
    'AGACHAMENTO_PARCIAL_ASSISTIDO',
    'ABDUCAO_QUADRIL_DECUBITO_LATERAL',
    'EQUILIBRIO_BIPODAL_TRANSFERENCIA_PESO',
    'PREENSAO_MANUAL_BOLA_MACIA',
    'MOBILIDADE_TORACICA_ROTACAO_SENTADA',
    'RETRACAO_ESCAPULAR_SENTADA',
    'ISOMETRIA_ROTACAO_EXTERNA_OMBRO',
    'EXTENSAO_JOELHO_SENTADO',
    'SENTAR_LEVANTAR_CONTROLADO',
    'ALONGAMENTO_FLEXORES_QUADRIL_MEIO_AJOELHADO',
    'MARCHA_ESTACIONARIA_APOIO',
    'MOBILIDADE_PUNHO_FLEXAO_EXTENSAO',
    'ALONGAMENTO_CERVICAL_LATERAL_ASSISTIDO',
    'DESLIZAMENTO_NEURAL_MEDIANO',
  ];

  private readonly mappings: ExerciseImageMapping[] = [
    {
      slug: 'mobilidade-lombar-gato-camelo',
      genericKey: 'MOBILIDADE_LOMBAR',
      specificKey: 'MOBILIDADE_LOMBAR_GATO_CAMELO',
    },
    {
      slug: 'ponte-curta',
      genericKey: 'MOBILIDADE_LOMBAR',
      specificKey: 'PONTE_CURTA',
    },
    {
      slug: 'controle-cervical-profundo',
      genericKey: 'CONTROLE_CERVICAL',
      specificKey: 'CONTROLE_CERVICAL_PROFUNDO',
    },
    {
      slug: 'elevacao-assistida-ombro',
      genericKey: 'OMBRO_MANGUITO',
      specificKey: 'ELEVACAO_ASSISTIDA_OMBRO',
    },
    {
      slug: 'agachamento-parcial-assistido',
      genericKey: 'JOELHO_AGACHAMENTO',
      specificKey: 'AGACHAMENTO_PARCIAL_ASSISTIDO',
    },
    {
      slug: 'abducao-quadril-decubito-lateral',
      genericKey: 'QUADRIL_GLUTEOS',
      specificKey: 'ABDUCAO_QUADRIL_DECUBITO_LATERAL',
    },
    {
      slug: 'equilibrio-bipodal-transferencia-peso',
      genericKey: 'TORNOZELO_EQUILIBRIO',
      specificKey: 'EQUILIBRIO_BIPODAL_TRANSFERENCIA_PESO',
    },
    {
      slug: 'preensao-manual-bola-macia',
      genericKey: 'PUNHO_PREENSAO',
      specificKey: 'PREENSAO_MANUAL_BOLA_MACIA',
    },
    {
      slug: 'mobilidade-toracica-rotacao-sentada',
      genericKey: 'MOBILIDADE_GERAL',
      specificKey: 'MOBILIDADE_TORACICA_ROTACAO_SENTADA',
    },
    {
      slug: 'retracao-escapular-sentada',
      genericKey: 'OMBRO_MANGUITO',
      specificKey: 'RETRACAO_ESCAPULAR_SENTADA',
    },
    {
      slug: 'isometria-rotacao-externa-ombro',
      genericKey: 'OMBRO_MANGUITO',
      specificKey: 'ISOMETRIA_ROTACAO_EXTERNA_OMBRO',
    },
    {
      slug: 'extensao-joelho-sentado',
      genericKey: 'JOELHO_AGACHAMENTO',
      specificKey: 'EXTENSAO_JOELHO_SENTADO',
    },
    {
      slug: 'sentar-levantar-controlado',
      genericKey: 'JOELHO_AGACHAMENTO',
      specificKey: 'SENTAR_LEVANTAR_CONTROLADO',
    },
    {
      slug: 'alongamento-flexores-quadril-meio-ajoelhado',
      genericKey: 'QUADRIL_GLUTEOS',
      specificKey: 'ALONGAMENTO_FLEXORES_QUADRIL_MEIO_AJOELHADO',
    },
    {
      slug: 'marcha-estacionaria-com-apoio',
      genericKey: 'TORNOZELO_EQUILIBRIO',
      specificKey: 'MARCHA_ESTACIONARIA_APOIO',
    },
    {
      slug: 'mobilidade-punho-flexao-extensao',
      genericKey: 'PUNHO_PREENSAO',
      specificKey: 'MOBILIDADE_PUNHO_FLEXAO_EXTENSAO',
    },
    {
      slug: 'alongamento-cervical-lateral-assistido',
      genericKey: 'CONTROLE_CERVICAL',
      specificKey: 'ALONGAMENTO_CERVICAL_LATERAL_ASSISTIDO',
    },
    {
      slug: 'deslizamento-neural-mediano',
      genericKey: 'PUNHO_PREENSAO',
      specificKey: 'DESLIZAMENTO_NEURAL_MEDIANO',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.replaceImageConstraints(queryRunner, [
      ...this.legacyImageTypes,
      ...this.specificImageTypes,
    ]);

    for (const mapping of this.mappings) {
      await this.applyImageKey(queryRunner, mapping, mapping.specificKey);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const mapping of this.mappings) {
      await this.applyImageKey(queryRunner, mapping, mapping.genericKey);
    }

    await this.replaceImageConstraints(queryRunner, this.legacyImageTypes);
  }

  private async replaceImageConstraints(
    queryRunner: QueryRunner,
    allowedImageTypes: string[],
  ): Promise<void> {
    const allowedSql = allowedImageTypes
      .map((value) => `'${value}'`)
      .join(', ');

    await queryRunner.query(`
      ALTER TABLE "exercicios"
      DROP CONSTRAINT IF EXISTS "CHK_EXERCICIOS_IMAGEM_KEY_PROPRIA"
    `);

    await queryRunner.query(`
      ALTER TABLE "atividades"
      DROP CONSTRAINT IF EXISTS "CHK_ATIVIDADES_IMAGEM_TIPO_PROPRIA"
    `);

    await queryRunner.query(`
      ALTER TABLE "atividades"
      ADD CONSTRAINT "CHK_ATIVIDADES_IMAGEM_TIPO_PROPRIA"
      CHECK ("imagem_tipo" IS NULL OR "imagem_tipo" IN (${allowedSql}))
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicios"
      ADD CONSTRAINT "CHK_EXERCICIOS_IMAGEM_KEY_PROPRIA"
      CHECK ("imagem_key" IS NULL OR "imagem_key" IN (${allowedSql}))
    `);
  }

  private async applyImageKey(
    queryRunner: QueryRunner,
    mapping: ExerciseImageMapping,
    imageKey: string,
  ): Promise<void> {
    await queryRunner.query(
      `
        UPDATE "exercicios"
        SET "imagem_key" = $2, "revisado_em" = now()
        WHERE "slug" = $1
      `,
      [mapping.slug, imageKey],
    );

    await queryRunner.query(
      `
        UPDATE "atividades" AS atividade
        SET "imagem_tipo" = $2
        FROM "exercicios" AS exercicio
        WHERE atividade."exercicio_id" = exercicio."id"
          AND exercicio."slug" = $1
      `,
      [mapping.slug, imageKey],
    );

    await queryRunner.query(
      `
        UPDATE "exercicio_midias" AS midia
        SET "asset_key" = $2,
            "tipo" = 'ILUSTRACAO',
            "source_type" = 'PROPRIA',
            "source_url" = NULL,
            "author" = 'Synap',
            "license" = 'PROPRIETARIA_SYNAP',
            "license_url" = NULL,
            "attribution_text" = 'Ilustracao propria Synap.',
            "ativo" = true,
            "revisado_em" = now()
        FROM "exercicios" AS exercicio
        WHERE midia."exercicio_id" = exercicio."id"
          AND exercicio."slug" = $1
          AND midia."asset_key" <> $2
          AND NOT EXISTS (
            SELECT 1
            FROM "exercicio_midias" AS existente
            WHERE existente."exercicio_id" = exercicio."id"
              AND existente."asset_key" = $2
          )
      `,
      [mapping.slug, imageKey],
    );

    await queryRunner.query(
      `
        INSERT INTO "exercicio_midias" (
          "exercicio_id", "asset_key", "tipo", "source_type", "source_url",
          "author", "license", "license_url", "attribution_text", "versao",
          "revisado_em", "ativo"
        )
        SELECT exercicio."id", $2::varchar, 'ILUSTRACAO', 'PROPRIA', NULL,
          'Synap', 'PROPRIETARIA_SYNAP', NULL, 'Ilustracao propria Synap.',
          1, now(), true
        FROM "exercicios" AS exercicio
        WHERE exercicio."slug" = $1
          AND NOT EXISTS (
            SELECT 1
            FROM "exercicio_midias" AS existente
            WHERE existente."exercicio_id" = exercicio."id"
              AND existente."asset_key" = $2::varchar
          )
      `,
      [mapping.slug, imageKey],
    );

    await queryRunner.query(
      `
        UPDATE "exercicio_midias" AS midia
        SET "ativo" = false, "revisado_em" = now()
        FROM "exercicios" AS exercicio
        WHERE midia."exercicio_id" = exercicio."id"
          AND exercicio."slug" = $1
          AND midia."asset_key" <> $2
      `,
      [mapping.slug, imageKey],
    );

    await queryRunner.query(
      `
        UPDATE "exercicio_midias" AS midia
        SET "ativo" = true,
            "tipo" = 'ILUSTRACAO',
            "source_type" = 'PROPRIA',
            "source_url" = NULL,
            "author" = 'Synap',
            "license" = 'PROPRIETARIA_SYNAP',
            "license_url" = NULL,
            "attribution_text" = 'Ilustracao propria Synap.',
            "revisado_em" = now()
        FROM "exercicios" AS exercicio
        WHERE midia."exercicio_id" = exercicio."id"
          AND exercicio."slug" = $1
          AND midia."asset_key" = $2
      `,
      [mapping.slug, imageKey],
    );
  }
}
