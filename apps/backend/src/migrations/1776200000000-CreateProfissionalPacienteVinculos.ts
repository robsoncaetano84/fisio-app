import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfissionalPacienteVinculos1776200000000
  implements MigrationInterface
{
  name = 'CreateProfissionalPacienteVinculos1776200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profissional_paciente_vinculos_status_enum') THEN
          CREATE TYPE "profissional_paciente_vinculos_status_enum" AS ENUM ('ATIVO', 'ENCERRADO');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profissional_paciente_vinculos_origem_enum') THEN
          CREATE TYPE "profissional_paciente_vinculos_origem_enum" AS ENUM ('CADASTRO_ASSISTIDO', 'CONVITE_RAPIDO', 'MANUAL');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "profissional_paciente_vinculos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "profissional_id" uuid NOT NULL,
        "paciente_id" uuid NOT NULL,
        "paciente_usuario_id" uuid NOT NULL,
        "status" "profissional_paciente_vinculos_status_enum" NOT NULL DEFAULT 'ATIVO',
        "origem" "profissional_paciente_vinculos_origem_enum" NOT NULL DEFAULT 'CADASTRO_ASSISTIDO',
        "ended_at" TIMESTAMP,
        CONSTRAINT "PK_profissional_paciente_vinculos_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ppv_profissional_id" FOREIGN KEY ("profissional_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_ppv_paciente_id" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_ppv_paciente_usuario_id" FOREIGN KEY ("paciente_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_VINCULO_PROFISSIONAL_STATUS"
      ON "profissional_paciente_vinculos" ("profissional_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_VINCULO_PACIENTE_USUARIO_STATUS"
      ON "profissional_paciente_vinculos" ("paciente_usuario_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_VINCULO_PACIENTE_STATUS"
      ON "profissional_paciente_vinculos" ("paciente_id", "status")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_VINCULO_ATIVO_POR_PACIENTE"
      ON "profissional_paciente_vinculos" ("paciente_id")
      WHERE "status" = 'ATIVO'
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_VINCULO_ATIVO_POR_PACIENTE_USUARIO"
      ON "profissional_paciente_vinculos" ("paciente_usuario_id")
      WHERE "status" = 'ATIVO'
    `);

    await queryRunner.query(`
      INSERT INTO "profissional_paciente_vinculos" (
        "profissional_id",
        "paciente_id",
        "paciente_usuario_id",
        "status",
        "origem",
        "ended_at",
        "created_at",
        "updated_at"
      )
      SELECT
        p."usuario_id" as profissional_id,
        p."id" as paciente_id,
        p."paciente_usuario_id" as paciente_usuario_id,
        'ATIVO'::"profissional_paciente_vinculos_status_enum" as status,
        CASE
          WHEN p."cadastro_origem" = 'CONVITE_RAPIDO' THEN 'CONVITE_RAPIDO'::"profissional_paciente_vinculos_origem_enum"
          ELSE 'CADASTRO_ASSISTIDO'::"profissional_paciente_vinculos_origem_enum"
        END as origem,
        NULL as ended_at,
        COALESCE(p."convite_aceito_em", p."updated_at", now()) as created_at,
        now() as updated_at
      FROM "pacientes" p
      WHERE p."ativo" = true
        AND p."paciente_usuario_id" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM "profissional_paciente_vinculos" v
          WHERE v."paciente_id" = p."id"
            AND v."status" = 'ATIVO'::"profissional_paciente_vinculos_status_enum"
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_VINCULO_ATIVO_POR_PACIENTE_USUARIO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_VINCULO_ATIVO_POR_PACIENTE"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_VINCULO_PACIENTE_STATUS"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_VINCULO_PACIENTE_USUARIO_STATUS"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_VINCULO_PROFISSIONAL_STATUS"`,
    );

    await queryRunner.query(
      `DROP TABLE IF EXISTS "profissional_paciente_vinculos"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "profissional_paciente_vinculos_origem_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "profissional_paciente_vinculos_status_enum"`,
    );
  }
}
