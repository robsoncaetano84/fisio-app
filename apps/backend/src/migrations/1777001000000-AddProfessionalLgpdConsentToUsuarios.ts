import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfessionalLgpdConsentToUsuarios1777001000000
  implements MigrationInterface
{
  name = 'AddProfessionalLgpdConsentToUsuarios1777001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "consent_professional_lgpd_required" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "consent_professional_lgpd_required"`,
    );
  }
}

