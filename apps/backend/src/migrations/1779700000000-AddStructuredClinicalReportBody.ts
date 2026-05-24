import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStructuredClinicalReportBody1779700000000 implements MigrationInterface {
  name = 'AddStructuredClinicalReportBody1779700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "laudos" ADD "motivo_avaliacao" text`);
    await queryRunner.query(
      `ALTER TABLE "laudos" ADD "historico_clinico" text`,
    );
    await queryRunner.query(`ALTER TABLE "laudos" ADD "achados_clinicos" text`);
    await queryRunner.query(`ALTER TABLE "laudos" ADD "conclusao" text`);
    await queryRunner.query(
      `ALTER TABLE "laudos" ALTER COLUMN "diagnostico_funcional" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "laudos" ALTER COLUMN "condutas" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "laudos" SET "diagnostico_funcional" = '' WHERE "diagnostico_funcional" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "laudos" SET "condutas" = '' WHERE "condutas" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "laudos" ALTER COLUMN "condutas" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "laudos" ALTER COLUMN "diagnostico_funcional" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "laudos" DROP COLUMN "conclusao"`);
    await queryRunner.query(
      `ALTER TABLE "laudos" DROP COLUMN "achados_clinicos"`,
    );
    await queryRunner.query(
      `ALTER TABLE "laudos" DROP COLUMN "historico_clinico"`,
    );
    await queryRunner.query(
      `ALTER TABLE "laudos" DROP COLUMN "motivo_avaliacao"`,
    );
  }
}
