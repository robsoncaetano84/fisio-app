import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAnamneseHistoricoFamiliarEsportivo1779500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "anamneses" DROP COLUMN IF EXISTS "historico_familiar"`,
    );
    await queryRunner.query(
      `ALTER TABLE "anamneses" DROP COLUMN IF EXISTS "historico_esportivo"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "historico_familiar" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "historico_esportivo" text`,
    );
  }
}
