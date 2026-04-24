import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAnamneseHistorico1779200000000 implements MigrationInterface {
  name = 'CreateAnamneseHistorico1779200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."anamneses_historico_acao_enum" AS ENUM('CREATE', 'UPDATE')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."anamneses_historico_origem_enum" AS ENUM('PROFISSIONAL', 'PACIENTE')
    `);
    await queryRunner.query(`
      CREATE TABLE "anamneses_historico" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "anamnese_id" uuid NOT NULL,
        "paciente_id" uuid NOT NULL,
        "revisao" integer NOT NULL,
        "acao" "public"."anamneses_historico_acao_enum" NOT NULL,
        "origem" "public"."anamneses_historico_origem_enum" NOT NULL,
        "alterado_por_usuario_id" uuid,
        "payload" jsonb NOT NULL,
        CONSTRAINT "PK_anamneses_historico_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_anamneses_historico_anamnese_created"
      ON "anamneses_historico" ("anamnese_id", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_anamneses_historico_paciente_created"
      ON "anamneses_historico" ("paciente_id", "created_at")
    `);
    await queryRunner.query(`
      ALTER TABLE "anamneses_historico"
      ADD CONSTRAINT "FK_anamneses_historico_anamnese"
      FOREIGN KEY ("anamnese_id") REFERENCES "anamneses"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "anamneses_historico"
      ADD CONSTRAINT "FK_anamneses_historico_paciente"
      FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "anamneses_historico" DROP CONSTRAINT "FK_anamneses_historico_paciente"
    `);
    await queryRunner.query(`
      ALTER TABLE "anamneses_historico" DROP CONSTRAINT "FK_anamneses_historico_anamnese"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."idx_anamneses_historico_paciente_created"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."idx_anamneses_historico_anamnese_created"
    `);
    await queryRunner.query(`
      DROP TABLE "anamneses_historico"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."anamneses_historico_origem_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."anamneses_historico_acao_enum"
    `);
  }
}

