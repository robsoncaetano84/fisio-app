import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAtividadeAcceptance1774200000000 implements MigrationInterface {
  name = 'AddAtividadeAcceptance1774200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "atividades"
      ADD COLUMN IF NOT EXISTS "aceite_profissional" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "atividades"
      ADD COLUMN IF NOT EXISTS "aceite_profissional_por_usuario_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "atividades"
      ADD COLUMN IF NOT EXISTS "aceite_profissional_em" timestamp
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "atividades" DROP COLUMN IF EXISTS "aceite_profissional_em"
    `);
    await queryRunner.query(`
      ALTER TABLE "atividades" DROP COLUMN IF EXISTS "aceite_profissional_por_usuario_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "atividades" DROP COLUMN IF EXISTS "aceite_profissional"
    `);
  }
}
