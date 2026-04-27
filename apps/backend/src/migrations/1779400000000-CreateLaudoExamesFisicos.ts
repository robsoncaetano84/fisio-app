import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLaudoExamesFisicos1779400000000
  implements MigrationInterface
{
  name = 'CreateLaudoExamesFisicos1779400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "laudo_exames_fisicos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "paciente_id" uuid NOT NULL,
        "laudo_id" uuid,
        "exame_fisico" text NOT NULL,
        "diagnostico_funcional" text,
        "condutas" text,
        "registrado_por_usuario_id" uuid,
        CONSTRAINT "PK_laudo_exames_fisicos" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_laudo_exames_fisicos_paciente" UNIQUE ("paciente_id"),
        CONSTRAINT "FK_laudo_exames_fisicos_paciente" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id"),
        CONSTRAINT "FK_laudo_exames_fisicos_laudo" FOREIGN KEY ("laudo_id") REFERENCES "laudos"("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_laudo_exames_fisicos_paciente_created"
      ON "laudo_exames_fisicos" ("paciente_id", "created_at")
    `);
    await queryRunner.query(`
      INSERT INTO "laudo_exames_fisicos" (
        "paciente_id",
        "laudo_id",
        "exame_fisico",
        "diagnostico_funcional",
        "condutas",
        "registrado_por_usuario_id",
        "created_at",
        "updated_at"
      )
      SELECT
        "paciente_id",
        "id",
        "exame_fisico",
        "diagnostico_funcional",
        "condutas",
        "validado_por_usuario_id",
        "created_at",
        "updated_at"
      FROM "laudos"
      WHERE "exame_fisico" IS NOT NULL
        AND btrim("exame_fisico") <> ''
      ON CONFLICT ("paciente_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_laudo_exames_fisicos_paciente_created"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "laudo_exames_fisicos"`);
  }
}
