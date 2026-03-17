import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPremiumAnamneseAndEvolucao1773716400000 implements MigrationInterface {
  name = 'AddPremiumAnamneseAndEvolucao1773716400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'anamneses_tipo_dor_enum') THEN
        CREATE TYPE "public"."anamneses_tipo_dor_enum" AS ENUM('MECANICA', 'INFLAMATORIA', 'NEUROPATICA', 'MISTA');
      END IF;
    END $$;`);
    await queryRunner.query(`ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "dor_repouso" boolean`);
    await queryRunner.query(`ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "dor_noturna" boolean`);
    await queryRunner.query(`ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "irradiacao" boolean`);
    await queryRunner.query(`ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "local_irradiacao" text`);
    await queryRunner.query(`ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "tipo_dor" "public"."anamneses_tipo_dor_enum"`);
    await queryRunner.query(`ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "sinais_sensibilizacao_central" text`);
    await queryRunner.query(`ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "red_flags" jsonb NOT NULL DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "yellow_flags" jsonb NOT NULL DEFAULT '[]'`);

    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evolucoes_dor_status_enum') THEN
        CREATE TYPE "public"."evolucoes_dor_status_enum" AS ENUM('MELHOROU', 'MANTEVE', 'PIOROU');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evolucoes_funcao_status_enum') THEN
        CREATE TYPE "public"."evolucoes_funcao_status_enum" AS ENUM('MELHOROU', 'MANTEVE', 'PIOROU');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evolucoes_adesao_status_enum') THEN
        CREATE TYPE "public"."evolucoes_adesao_status_enum" AS ENUM('ALTA', 'MEDIA', 'BAIXA');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evolucoes_status_evolucao_enum') THEN
        CREATE TYPE "public"."evolucoes_status_evolucao_enum" AS ENUM('EVOLUINDO_BEM', 'ESTAGNADO', 'PIORA');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evolucoes_conduta_status_enum') THEN
        CREATE TYPE "public"."evolucoes_conduta_status_enum" AS ENUM('MANTER', 'PROGREDIR', 'REGREDIR', 'REAVALIAR');
      END IF;
    END $$;`);
    await queryRunner.query(`ALTER TABLE "evolucoes" ADD COLUMN IF NOT EXISTS "dor_status" "public"."evolucoes_dor_status_enum"`);
    await queryRunner.query(`ALTER TABLE "evolucoes" ADD COLUMN IF NOT EXISTS "funcao_status" "public"."evolucoes_funcao_status_enum"`);
    await queryRunner.query(`ALTER TABLE "evolucoes" ADD COLUMN IF NOT EXISTS "adesao_status" "public"."evolucoes_adesao_status_enum"`);
    await queryRunner.query(`ALTER TABLE "evolucoes" ADD COLUMN IF NOT EXISTS "status_evolucao" "public"."evolucoes_status_evolucao_enum"`);
    await queryRunner.query(`ALTER TABLE "evolucoes" ADD COLUMN IF NOT EXISTS "conduta_status" "public"."evolucoes_conduta_status_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "evolucoes" DROP COLUMN IF EXISTS "conduta_status"`);
    await queryRunner.query(`ALTER TABLE "evolucoes" DROP COLUMN IF EXISTS "status_evolucao"`);
    await queryRunner.query(`ALTER TABLE "evolucoes" DROP COLUMN IF EXISTS "adesao_status"`);
    await queryRunner.query(`ALTER TABLE "evolucoes" DROP COLUMN IF EXISTS "funcao_status"`);
    await queryRunner.query(`ALTER TABLE "evolucoes" DROP COLUMN IF EXISTS "dor_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."evolucoes_conduta_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."evolucoes_status_evolucao_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."evolucoes_adesao_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."evolucoes_funcao_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."evolucoes_dor_status_enum"`);
    await queryRunner.query(`ALTER TABLE "anamneses" DROP COLUMN IF EXISTS "yellow_flags"`);
    await queryRunner.query(`ALTER TABLE "anamneses" DROP COLUMN IF EXISTS "red_flags"`);
    await queryRunner.query(`ALTER TABLE "anamneses" DROP COLUMN IF EXISTS "sinais_sensibilizacao_central"`);
    await queryRunner.query(`ALTER TABLE "anamneses" DROP COLUMN IF EXISTS "tipo_dor"`);
    await queryRunner.query(`ALTER TABLE "anamneses" DROP COLUMN IF EXISTS "local_irradiacao"`);
    await queryRunner.query(`ALTER TABLE "anamneses" DROP COLUMN IF EXISTS "irradiacao"`);
    await queryRunner.query(`ALTER TABLE "anamneses" DROP COLUMN IF EXISTS "dor_noturna"`);
    await queryRunner.query(`ALTER TABLE "anamneses" DROP COLUMN IF EXISTS "dor_repouso"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."anamneses_tipo_dor_enum"`);
  }
}
