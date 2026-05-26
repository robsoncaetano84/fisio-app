import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLaudoAiGenerations1779900000000 implements MigrationInterface {
  name = 'CreateLaudoAiGenerations1779900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "laudo_ai_generations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "paciente_id" uuid NOT NULL,
        "generated_on" date NOT NULL,
        CONSTRAINT "PK_laudo_ai_generations" PRIMARY KEY ("id"),
        CONSTRAINT "uq_laudo_ai_generations_paciente_dia" UNIQUE ("paciente_id", "generated_on"),
        CONSTRAINT "FK_laudo_ai_generations_paciente" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_laudo_ai_generations_generated_on"
      ON "laudo_ai_generations" ("generated_on")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_laudo_ai_generations_generated_on"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "laudo_ai_generations"`);
  }
}
