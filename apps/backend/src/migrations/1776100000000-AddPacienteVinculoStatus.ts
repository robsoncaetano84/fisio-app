import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPacienteVinculoStatus1776100000000 implements MigrationInterface {
  name = 'AddPacienteVinculoStatus1776100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pacientes_cadastro_origem_enum') THEN
          CREATE TYPE "pacientes_cadastro_origem_enum" AS ENUM ('CADASTRO_ASSISTIDO', 'CONVITE_RAPIDO');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pacientes_vinculo_status_enum') THEN
          CREATE TYPE "pacientes_vinculo_status_enum" AS ENUM ('SEM_VINCULO', 'CONVITE_ENVIADO', 'VINCULADO', 'VINCULADO_PENDENTE_COMPLEMENTO', 'BLOQUEADO_CONFLITO');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "pacientes"
      ADD COLUMN IF NOT EXISTS "cadastro_origem" "pacientes_cadastro_origem_enum" NOT NULL DEFAULT 'CADASTRO_ASSISTIDO',
      ADD COLUMN IF NOT EXISTS "vinculo_status" "pacientes_vinculo_status_enum" NOT NULL DEFAULT 'SEM_VINCULO',
      ADD COLUMN IF NOT EXISTS "convite_enviado_em" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "convite_aceito_em" TIMESTAMP
    `);

    await queryRunner.query(`
      UPDATE "pacientes"
      SET "vinculo_status" = CASE
        WHEN "paciente_usuario_id" IS NULL THEN 'SEM_VINCULO'::"pacientes_vinculo_status_enum"
        ELSE 'VINCULADO'::"pacientes_vinculo_status_enum"
      END
      WHERE "vinculo_status" IS NULL
         OR "vinculo_status" = 'SEM_VINCULO'::"pacientes_vinculo_status_enum"
    `);

    await queryRunner.query(`
      UPDATE "pacientes"
      SET "convite_aceito_em" = NOW()
      WHERE "paciente_usuario_id" IS NOT NULL AND "convite_aceito_em" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pacientes"
      DROP COLUMN IF EXISTS "convite_aceito_em",
      DROP COLUMN IF EXISTS "convite_enviado_em",
      DROP COLUMN IF EXISTS "vinculo_status",
      DROP COLUMN IF EXISTS "cadastro_origem"
    `);

    await queryRunner.query(`DROP TYPE IF EXISTS "pacientes_vinculo_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "pacientes_cadastro_origem_enum"`);
  }
}
