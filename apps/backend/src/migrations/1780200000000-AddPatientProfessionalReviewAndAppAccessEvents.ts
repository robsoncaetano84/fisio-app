import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPatientProfessionalReviewAndAppAccessEvents1780200000000 implements MigrationInterface {
  name = 'AddPatientProfessionalReviewAndAppAccessEvents1780200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE TYPE "public"."anamneses_origem_enum" AS ENUM ('PROFISSIONAL', 'PACIENTE');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "anamneses"
      ADD COLUMN IF NOT EXISTS "origem" "public"."anamneses_origem_enum" NOT NULL DEFAULT 'PROFISSIONAL'
    `);

    await queryRunner.query(`
      ALTER TABLE "anamneses"
      ADD COLUMN IF NOT EXISTS "validada_por_usuario_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "anamneses"
      ADD COLUMN IF NOT EXISTS "validada_em" timestamp
    `);

    await queryRunner.query(`
      ALTER TABLE "anamneses"
      ADD COLUMN IF NOT EXISTS "validacao_observacao" text
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."anamneses_historico_acao_enum"
      ADD VALUE IF NOT EXISTS 'VALIDATE'
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_anamneses_paciente_validacao"
      ON "anamneses" ("paciente_id", "validada_em" DESC)
    `);

    await queryRunner.query(`
      ALTER TABLE "pacientes"
      ADD COLUMN IF NOT EXISTS "app_access_events" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pacientes"
      DROP COLUMN IF EXISTS "app_access_events"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_anamneses_paciente_validacao"
    `);

    await queryRunner.query(`
      ALTER TABLE "anamneses"
      DROP COLUMN IF EXISTS "validacao_observacao"
    `);

    await queryRunner.query(`
      ALTER TABLE "anamneses"
      DROP COLUMN IF EXISTS "validada_em"
    `);

    await queryRunner.query(`
      ALTER TABLE "anamneses"
      DROP COLUMN IF EXISTS "validada_por_usuario_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "anamneses"
      DROP COLUMN IF EXISTS "origem"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."anamneses_origem_enum"
    `);
  }
}
