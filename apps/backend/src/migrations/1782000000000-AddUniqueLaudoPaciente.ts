import { MigrationInterface, QueryRunner } from 'typeorm';

// F7: garante um unico laudo por paciente no nivel do banco (backstop contra
// corrida entre requisicoes). A aplicacao ja tratava isso em codigo; aqui
// tornamos invariante. Requer ausencia de duplicatas pre-existentes.
export class AddUniqueLaudoPaciente1782000000000 implements MigrationInterface {
  name = 'AddUniqueLaudoPaciente1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_LAUDO_PACIENTE_ID" ON "laudos" ("paciente_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_LAUDO_PACIENTE_ID"`);
  }
}
