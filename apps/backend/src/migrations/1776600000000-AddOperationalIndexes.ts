import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOperationalIndexes1776600000000 implements MigrationInterface {
  name = 'AddOperationalIndexes1776600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PACIENTE_USUARIO_ATIVO"
      ON "pacientes" ("usuario_id", "ativo")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PACIENTE_USUARIO_NOME"
      ON "pacientes" ("usuario_id", "nome_completo")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PACIENTE_SOLICITACAO_ANAMNESE"
      ON "pacientes" ("usuario_id", "anamnese_solicitacao_pendente")
      WHERE "ativo" = true
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ANAMNESE_PACIENTE"
      ON "anamneses" ("paciente_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_EVOLUCAO_PACIENTE_DATA"
      ON "evolucoes" ("paciente_id", "data")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PACIENTE_EXAME_PACIENTE_CREATED"
      ON "paciente_exames" ("paciente_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_VINCULO_PROFISSIONAL_STATUS_PACIENTE"
      ON "profissional_paciente_vinculos" ("profissional_id", "status", "paciente_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_VINCULO_PROFISSIONAL_STATUS_PACIENTE"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_PACIENTE_EXAME_PACIENTE_CREATED"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_EVOLUCAO_PACIENTE_DATA"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ANAMNESE_PACIENTE"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_PACIENTE_SOLICITACAO_ANAMNESE"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_PACIENTE_USUARIO_NOME"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_PACIENTE_USUARIO_ATIVO"`);
  }
}

