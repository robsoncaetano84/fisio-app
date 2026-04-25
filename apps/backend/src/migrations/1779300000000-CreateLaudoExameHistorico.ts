import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLaudoExameHistorico1779300000000
  implements MigrationInterface
{
  name = 'CreateLaudoExameHistorico1779300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."laudo_exame_historico_acao_enum" AS ENUM('CREATE', 'UPDATE')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."laudo_exame_historico_origem_enum" AS ENUM('PROFISSIONAL', 'SISTEMA')
    `);
    await queryRunner.query(`
      CREATE TABLE "laudo_exame_historico" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "laudo_id" uuid NOT NULL,
        "paciente_id" uuid NOT NULL,
        "revisao" integer NOT NULL,
        "acao" "public"."laudo_exame_historico_acao_enum" NOT NULL,
        "origem" "public"."laudo_exame_historico_origem_enum" NOT NULL,
        "alterado_por_usuario_id" uuid,
        "payload" jsonb NOT NULL,
        CONSTRAINT "PK_laudo_exame_historico_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_laudo_exame_historico_laudo_created"
      ON "laudo_exame_historico" ("laudo_id", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_laudo_exame_historico_paciente_created"
      ON "laudo_exame_historico" ("paciente_id", "created_at")
    `);
    await queryRunner.query(`
      ALTER TABLE "laudo_exame_historico"
      ADD CONSTRAINT "FK_laudo_exame_historico_laudo"
      FOREIGN KEY ("laudo_id") REFERENCES "laudos"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "laudo_exame_historico"
      ADD CONSTRAINT "FK_laudo_exame_historico_paciente"
      FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "laudo_exame_historico" DROP CONSTRAINT "FK_laudo_exame_historico_paciente"
    `);
    await queryRunner.query(`
      ALTER TABLE "laudo_exame_historico" DROP CONSTRAINT "FK_laudo_exame_historico_laudo"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."idx_laudo_exame_historico_paciente_created"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."idx_laudo_exame_historico_laudo_created"
    `);
    await queryRunner.query(`
      DROP TABLE "laudo_exame_historico"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."laudo_exame_historico_origem_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."laudo_exame_historico_acao_enum"
    `);
  }
}

