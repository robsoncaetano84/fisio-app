import { MigrationInterface, QueryRunner } from 'typeorm';

// F16: CPF passa a ser unico por profissional, nao global. Remove o unique
// global (nome auto-gerado pelo synchronize) e cria unique composto
// (usuario_id, cpf). Requer ausencia de duplicatas (usuario_id, cpf).
export class PacienteCpfUniquePorProfissional1782000300000
  implements MigrationInterface
{
  name = 'PacienteCpfUniquePorProfissional1782000300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove constraints UNIQUE de coluna unica sobre cpf (nome desconhecido).
    await queryRunner.query(`
      DO $$
      DECLARE cname text;
      BEGIN
        FOR cname IN
          SELECT tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
           AND tc.table_schema = ccu.table_schema
          WHERE tc.table_name = 'pacientes'
            AND tc.constraint_type = 'UNIQUE'
            AND ccu.column_name = 'cpf'
            AND (
              SELECT count(*) FROM information_schema.constraint_column_usage x
              WHERE x.constraint_name = tc.constraint_name
                AND x.table_schema = tc.table_schema
            ) = 1
        LOOP
          EXECUTE format('ALTER TABLE "pacientes" DROP CONSTRAINT %I', cname);
        END LOOP;
      END $$;
    `);

    // Remove tambem eventual indice unico de coluna unica sobre cpf.
    await queryRunner.query(`
      DO $$
      DECLARE iname text;
      BEGIN
        FOR iname IN
          SELECT i.indexrelid::regclass::text
          FROM pg_index i
          JOIN pg_class t ON t.oid = i.indrelid
          WHERE t.relname = 'pacientes'
            AND i.indisunique
            AND i.indnatts = 1
            AND (
              SELECT a.attname FROM pg_attribute a
              WHERE a.attrelid = t.oid AND a.attnum = i.indkey[0]
            ) = 'cpf'
            AND NOT i.indisprimary
        LOOP
          EXECUTE format('DROP INDEX %s', iname);
        END LOOP;
      END $$;
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_PACIENTE_USUARIO_CPF" ON "pacientes" ("usuario_id", "cpf")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_PACIENTE_USUARIO_CPF"`,
    );
    // Restaura o unique global de cpf.
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_PACIENTE_CPF" ON "pacientes" ("cpf")`,
    );
  }
}
