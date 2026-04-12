import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMelhoriaSessaoToAtividadeCheckin1776500000000
  implements MigrationInterface
{
  name = 'AddMelhoriaSessaoToAtividadeCheckin1776500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "atividade_checkins"
      ADD COLUMN IF NOT EXISTS "melhoria_sessao" character varying(20),
      ADD COLUMN IF NOT EXISTS "melhoria_descricao" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "atividade_checkins"
      DROP COLUMN IF EXISTS "melhoria_descricao",
      DROP COLUMN IF EXISTS "melhoria_sessao"
    `);
  }
}