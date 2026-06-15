import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAtividadeExerciseImageFields1780600000000 implements MigrationInterface {
  name = 'AddAtividadeExerciseImageFields1780600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "atividades"
      ADD COLUMN IF NOT EXISTS "instrucoes_execucao" TEXT
    `);

    await queryRunner.query(`
      ALTER TABLE "atividades"
      ADD COLUMN IF NOT EXISTS "imagem_url" TEXT
    `);

    await queryRunner.query(`
      ALTER TABLE "atividades"
      ADD COLUMN IF NOT EXISTS "imagem_tipo" VARCHAR(80)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "atividades"
      DROP COLUMN IF EXISTS "imagem_tipo"
    `);

    await queryRunner.query(`
      ALTER TABLE "atividades"
      DROP COLUMN IF EXISTS "imagem_url"
    `);

    await queryRunner.query(`
      ALTER TABLE "atividades"
      DROP COLUMN IF EXISTS "instrucoes_execucao"
    `);
  }
}
