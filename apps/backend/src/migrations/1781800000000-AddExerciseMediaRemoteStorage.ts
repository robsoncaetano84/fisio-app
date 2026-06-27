import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExerciseMediaRemoteStorage1781800000000 implements MigrationInterface {
  name = 'AddExerciseMediaRemoteStorage1781800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      ADD COLUMN IF NOT EXISTS "storage_path" varchar(512)
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      ADD COLUMN IF NOT EXISTS "thumbnail_url" text
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      ADD COLUMN IF NOT EXISTS "image_url" text
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      ADD COLUMN IF NOT EXISTS "mime_type" varchar(80)
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      ADD COLUMN IF NOT EXISTS "width" int
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      ADD COLUMN IF NOT EXISTS "height" int
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      ADD COLUMN IF NOT EXISTS "bytes" int
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_EXERCICIO_MIDIA_STORAGE_PATH"
      ON "exercicio_midias" ("storage_path")
      WHERE "storage_path" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_EXERCICIO_MIDIA_STORAGE_PATH"`,
    );

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      DROP COLUMN IF EXISTS "bytes"
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      DROP COLUMN IF EXISTS "height"
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      DROP COLUMN IF EXISTS "width"
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      DROP COLUMN IF EXISTS "mime_type"
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      DROP COLUMN IF EXISTS "image_url"
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      DROP COLUMN IF EXISTS "thumbnail_url"
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      DROP COLUMN IF EXISTS "storage_path"
    `);
  }
}
