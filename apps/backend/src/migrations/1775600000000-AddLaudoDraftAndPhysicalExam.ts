import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLaudoDraftAndPhysicalExam1775600000000 implements MigrationInterface {
  name = 'AddLaudoDraftAndPhysicalExam1775600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "laudos" ADD COLUMN IF NOT EXISTS "exame_fisico" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "laudos" ADD COLUMN IF NOT EXISTS "rascunho_profissional" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "laudos" DROP COLUMN IF EXISTS "rascunho_profissional"`,
    );
    await queryRunner.query(
      `ALTER TABLE "laudos" DROP COLUMN IF EXISTS "exame_fisico"`,
    );
  }
}
