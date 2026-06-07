import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLaudoPatientPublication1780100000000 implements MigrationInterface {
  name = 'AddLaudoPatientPublication1780100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."laudos_status_enum"
      ADD VALUE IF NOT EXISTS 'PUBLICADO_PACIENTE'
    `);

    await queryRunner.query(`
      ALTER TABLE "laudos"
      ADD COLUMN IF NOT EXISTS "publicado_paciente_por_usuario_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "laudos"
      ADD COLUMN IF NOT EXISTS "publicado_paciente_em" timestamp
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_laudos_paciente_publicado"
      ON "laudos" ("paciente_id", "publicado_paciente_em" DESC)
      WHERE "publicado_paciente_em" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "laudos"
      SET "status" = 'VALIDADO_PROFISSIONAL'
      WHERE "status" = 'PUBLICADO_PACIENTE'
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_laudos_paciente_publicado"
    `);

    await queryRunner.query(`
      ALTER TABLE "laudos"
      DROP COLUMN IF EXISTS "publicado_paciente_em"
    `);

    await queryRunner.query(`
      ALTER TABLE "laudos"
      DROP COLUMN IF EXISTS "publicado_paciente_por_usuario_id"
    `);
  }
}
