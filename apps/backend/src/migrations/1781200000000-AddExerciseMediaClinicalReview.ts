import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExerciseMediaClinicalReview1781200000000 implements MigrationInterface {
  name = 'AddExerciseMediaClinicalReview1781200000000';

  private readonly statuses = [
    'PENDENTE',
    'APROVADA',
    'REGENERAR_IMAGEM',
    'AJUSTAR_TEXTO',
    'REMOVER_DO_CATALOGO',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      ADD COLUMN IF NOT EXISTS "revisao_clinica_status" varchar(40) NOT NULL DEFAULT 'PENDENTE'
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      ADD COLUMN IF NOT EXISTS "revisao_clinica_observacao" text
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      ADD COLUMN IF NOT EXISTS "revisao_clinica_por_usuario_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      ADD COLUMN IF NOT EXISTS "revisao_clinica_em" timestamp
    `);

    await queryRunner.query(`
      UPDATE "exercicio_midias"
      SET "revisao_clinica_status" = 'PENDENTE'
      WHERE "revisao_clinica_status" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      DROP CONSTRAINT IF EXISTS "CHK_EXERCICIO_MIDIAS_REVISAO_CLINICA_STATUS"
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      ADD CONSTRAINT "CHK_EXERCICIO_MIDIAS_REVISAO_CLINICA_STATUS"
      CHECK ("revisao_clinica_status" IN (${this.toSqlList(this.statuses)}))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      DROP CONSTRAINT IF EXISTS "CHK_EXERCICIO_MIDIAS_REVISAO_CLINICA_STATUS"
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      DROP COLUMN IF EXISTS "revisao_clinica_em"
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      DROP COLUMN IF EXISTS "revisao_clinica_por_usuario_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      DROP COLUMN IF EXISTS "revisao_clinica_observacao"
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicio_midias"
      DROP COLUMN IF EXISTS "revisao_clinica_status"
    `);
  }

  private toSqlList(values: string[]): string {
    return values.map((value) => `'${value}'`).join(', ');
  }
}
