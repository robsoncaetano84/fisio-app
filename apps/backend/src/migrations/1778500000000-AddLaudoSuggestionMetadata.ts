import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLaudoSuggestionMetadata1778500000000
  implements MigrationInterface
{
  name = 'AddLaudoSuggestionMetadata1778500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "laudos" ADD "sugestao_source" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "laudos" ADD "exames_considerados" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "laudos" ADD "exames_com_leitura_ia" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "laudos" ADD "sugestao_gerada_em" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "laudos" DROP COLUMN "sugestao_gerada_em"`);
    await queryRunner.query(
      `ALTER TABLE "laudos" DROP COLUMN "exames_com_leitura_ia"`,
    );
    await queryRunner.query(`ALTER TABLE "laudos" DROP COLUMN "exames_considerados"`);
    await queryRunner.query(`ALTER TABLE "laudos" DROP COLUMN "sugestao_source"`);
  }
}

