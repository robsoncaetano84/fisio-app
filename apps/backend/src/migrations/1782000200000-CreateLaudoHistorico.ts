import { MigrationInterface, QueryRunner } from 'typeorm';

// F6: tabela de trilha de versoes do laudo.
export class CreateLaudoHistorico1782000200000 implements MigrationInterface {
  name = 'CreateLaudoHistorico1782000200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "laudo_historico" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "laudo_id" uuid NOT NULL,
        "paciente_id" uuid NOT NULL,
        "acao" character varying(20) NOT NULL,
        "status" character varying(40) NOT NULL,
        "snapshot" jsonb NOT NULL,
        "alterado_por_usuario_id" uuid NOT NULL,
        CONSTRAINT "PK_laudo_historico" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_LAUDO_HISTORICO_LAUDO" ON "laudo_historico" ("laudo_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_LAUDO_HISTORICO_LAUDO"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "laudo_historico"`);
  }
}
