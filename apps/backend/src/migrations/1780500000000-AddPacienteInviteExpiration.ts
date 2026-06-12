import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPacienteInviteExpiration1780500000000 implements MigrationInterface {
  name = 'AddPacienteInviteExpiration1780500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pacientes"
      ADD COLUMN IF NOT EXISTS "convite_expira_em" TIMESTAMP
    `);

    await queryRunner.query(`
      UPDATE "pacientes"
      SET "convite_expira_em" = "convite_enviado_em" + INTERVAL '7 days'
      WHERE "convite_expira_em" IS NULL
        AND "vinculo_status" = 'CONVITE_ENVIADO'
        AND "convite_enviado_em" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pacientes"
      DROP COLUMN IF EXISTS "convite_expira_em"
    `);
  }
}
