import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakePacienteAddressOptional1779800000000 implements MigrationInterface {
  name = 'MakePacienteAddressOptional1779800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pacientes" ALTER COLUMN "endereco_rua" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pacientes" ALTER COLUMN "endereco_numero" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pacientes" ALTER COLUMN "endereco_bairro" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pacientes" ALTER COLUMN "endereco_cep" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pacientes" ALTER COLUMN "endereco_cidade" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pacientes" ALTER COLUMN "endereco_uf" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "pacientes" SET "endereco_rua" = '' WHERE "endereco_rua" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "pacientes" SET "endereco_numero" = '' WHERE "endereco_numero" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "pacientes" SET "endereco_bairro" = '' WHERE "endereco_bairro" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "pacientes" SET "endereco_cep" = '00000000' WHERE "endereco_cep" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "pacientes" SET "endereco_cidade" = '' WHERE "endereco_cidade" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "pacientes" SET "endereco_uf" = 'NA' WHERE "endereco_uf" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pacientes" ALTER COLUMN "endereco_uf" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pacientes" ALTER COLUMN "endereco_cidade" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pacientes" ALTER COLUMN "endereco_cep" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pacientes" ALTER COLUMN "endereco_bairro" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pacientes" ALTER COLUMN "endereco_numero" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pacientes" ALTER COLUMN "endereco_rua" SET NOT NULL`,
    );
  }
}
