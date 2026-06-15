import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeExerciseImageFields1780800000000 implements MigrationInterface {
  name = 'NormalizeExerciseImageFields1780800000000';

  private readonly allowedImageTypes = [
    'MOBILIDADE_GERAL',
    'MOBILIDADE_LOMBAR',
    'CONTROLE_CERVICAL',
    'OMBRO_MANGUITO',
    'JOELHO_AGACHAMENTO',
    'QUADRIL_GLUTEOS',
    'TORNOZELO_EQUILIBRIO',
    'PUNHO_PREENSAO',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const allowedSql = this.allowedImageTypes
      .map((value) => `'${value}'`)
      .join(', ');

    await queryRunner.query(`
      UPDATE "atividades"
      SET "imagem_url" = NULL
      WHERE "imagem_url" IS NOT NULL
    `);

    await queryRunner.query(`
      UPDATE "atividades"
      SET "imagem_tipo" = NULL
      WHERE "imagem_tipo" IS NOT NULL
        AND "imagem_tipo" NOT IN (${allowedSql})
    `);

    await queryRunner.query(`
      UPDATE "exercicios"
      SET "imagem_key" = NULL
      WHERE "imagem_key" IS NOT NULL
        AND "imagem_key" NOT IN (${allowedSql})
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'CHK_ATIVIDADES_IMAGEM_TIPO_PROPRIA'
            AND table_name = 'atividades'
        ) THEN
          ALTER TABLE "atividades"
          ADD CONSTRAINT "CHK_ATIVIDADES_IMAGEM_TIPO_PROPRIA"
          CHECK ("imagem_tipo" IS NULL OR "imagem_tipo" IN (${allowedSql}));
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'CHK_EXERCICIOS_IMAGEM_KEY_PROPRIA'
            AND table_name = 'exercicios'
        ) THEN
          ALTER TABLE "exercicios"
          ADD CONSTRAINT "CHK_EXERCICIOS_IMAGEM_KEY_PROPRIA"
          CHECK ("imagem_key" IS NULL OR "imagem_key" IN (${allowedSql}));
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exercicios"
      DROP CONSTRAINT IF EXISTS "CHK_EXERCICIOS_IMAGEM_KEY_PROPRIA"
    `);

    await queryRunner.query(`
      ALTER TABLE "atividades"
      DROP CONSTRAINT IF EXISTS "CHK_ATIVIDADES_IMAGEM_TIPO_PROPRIA"
    `);
  }
}
