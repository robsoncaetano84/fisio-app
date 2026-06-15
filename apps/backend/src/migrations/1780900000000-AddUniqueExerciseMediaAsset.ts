import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueExerciseMediaAsset1780900000000 implements MigrationInterface {
  name = 'AddUniqueExerciseMediaAsset1780900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          "id",
          ROW_NUMBER() OVER (
            PARTITION BY "exercicio_id", "asset_key"
            ORDER BY "ativo" DESC, "updated_at" DESC, "created_at" DESC
          ) AS rn
        FROM "exercicio_midias"
      )
      DELETE FROM "exercicio_midias"
      WHERE "id" IN (
        SELECT "id"
        FROM ranked
        WHERE rn > 1
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_EXERCICIO_MIDIA_ASSET"
      ON "exercicio_midias" ("exercicio_id", "asset_key")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_EXERCICIO_MIDIA_ASSET"
    `);
  }
}
