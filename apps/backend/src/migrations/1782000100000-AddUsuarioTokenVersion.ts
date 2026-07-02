import { MigrationInterface, QueryRunner } from 'typeorm';

// F9: token_version permite revogar tokens (logout real). Default 0 casa com o
// tratamento de tokens antigos (sem o claim) como versao 0, evitando logout em
// massa no deploy.
export class AddUsuarioTokenVersion1782000100000 implements MigrationInterface {
  name = 'AddUsuarioTokenVersion1782000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "token_version" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "token_version"`,
    );
  }
}
