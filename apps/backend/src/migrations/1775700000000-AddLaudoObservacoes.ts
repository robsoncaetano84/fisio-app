import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLaudoObservacoes1775700000000 implements MigrationInterface {
  name = 'AddLaudoObservacoes1775700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "laudos" ADD COLUMN IF NOT EXISTS "observacoes" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "laudos" DROP COLUMN IF EXISTS "observacoes"`,
    );
  }
}
