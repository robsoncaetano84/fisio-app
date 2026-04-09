import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConselhoProfToUsuarios1776000000000 implements MigrationInterface {
  name = 'AddConselhoProfToUsuarios1776000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "conselho_prof" character varying(50)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "conselho_prof"`,
    );
  }
}
