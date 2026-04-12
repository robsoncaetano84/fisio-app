import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPacienteAnamneseRequest1776400000000
  implements MigrationInterface
{
  name = 'AddPacienteAnamneseRequest1776400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "anamnese_solicitacao_pendente" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "anamnese_solicitacao_em" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "anamnese_solicitacao_ultima_em" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pacientes" DROP COLUMN IF EXISTS "anamnese_solicitacao_ultima_em"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pacientes" DROP COLUMN IF EXISTS "anamnese_solicitacao_em"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pacientes" DROP COLUMN IF EXISTS "anamnese_solicitacao_pendente"`,
    );
  }
}
