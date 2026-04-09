import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConselhoSiglaUfToUsuarios1776000100000 implements MigrationInterface {
  name = 'AddConselhoSiglaUfToUsuarios1776000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "conselho_sigla" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "conselho_uf" character varying(2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "conselho_uf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "conselho_sigla"`,
    );
  }
}
