"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopePacienteCpfPorProfissional1776300000000 = void 0;
class ScopePacienteCpfPorProfissional1776300000000 {
    name = 'ScopePacienteCpfPorProfissional1776300000000';
    async up(queryRunner) {
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
    async down(queryRunner) {
        await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_PACIENTE_USUARIO_CPF"
    `);
        await queryRunner.query(`
      ALTER TABLE "pacientes"
      ADD CONSTRAINT "UQ_PACIENTES_CPF_GLOBAL" UNIQUE ("cpf")
    `);
    }
}
exports.ScopePacienteCpfPorProfissional1776300000000 = ScopePacienteCpfPorProfissional1776300000000;
//# sourceMappingURL=1776300000000-ScopePacienteCpfPorProfissional.js.map