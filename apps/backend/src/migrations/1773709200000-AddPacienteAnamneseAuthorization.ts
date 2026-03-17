import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPacienteAnamneseAuthorization1773709200000 implements MigrationInterface {
  name = 'AddPacienteAnamneseAuthorization1773709200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "anamnese_liberada_paciente" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pacientes" DROP COLUMN IF EXISTS "anamnese_liberada_paciente"`,
    );
  }
}
