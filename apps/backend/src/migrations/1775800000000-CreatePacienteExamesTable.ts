import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePacienteExamesTable1775800000000 implements MigrationInterface {
  name = 'CreatePacienteExamesTable1775800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "paciente_exames" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "paciente_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "nome_original" character varying(255) NOT NULL,
        "nome_arquivo" character varying(255) NOT NULL,
        "mime_type" character varying(120) NOT NULL,
        "tamanho_bytes" integer NOT NULL,
        "caminho_arquivo" character varying(500) NOT NULL,
        "tipo_exame" character varying(120),
        "observacao" text,
        "data_exame" date,
        CONSTRAINT "PK_paciente_exames_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_paciente_exames_paciente" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_paciente_exames_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_PACIENTE_EXAME_PACIENTE" ON "paciente_exames" ("paciente_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_PACIENTE_EXAME_USUARIO" ON "paciente_exames" ("usuario_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_PACIENTE_EXAME_USUARIO"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_PACIENTE_EXAME_PACIENTE"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "paciente_exames"`);
  }
}
