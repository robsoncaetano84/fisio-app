import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScopePacienteCpfPorProfissional1776300000000
  implements MigrationInterface
{
  name = 'ScopePacienteCpfPorProfissional1776300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT tc.constraint_name INTO constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'pacientes'
          AND tc.constraint_type = 'UNIQUE'
          AND ccu.column_name = 'cpf'
        LIMIT 1;

        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "pacientes" DROP CONSTRAINT %I', constraint_name);
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_PACIENTE_USUARIO_CPF"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_PACIENTE_USUARIO_CPF"
      ON "pacientes" ("usuario_id", "cpf")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_PACIENTE_USUARIO_CPF"
    `);

    await queryRunner.query(`
      ALTER TABLE "pacientes"
      ADD CONSTRAINT "UQ_PACIENTES_CPF_GLOBAL" UNIQUE ("cpf")
    `);
  }
}
