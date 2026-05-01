import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClinicalPhotosAndFenotipoDor1779600000000
  implements MigrationInterface
{
  name = 'CreateClinicalPhotosAndFenotipoDor1779600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clinical_photos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "paciente_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "nome_original" character varying(255) NOT NULL,
        "nome_arquivo" character varying(255) NOT NULL,
        "mime_type" character varying(120) NOT NULL,
        "tamanho_bytes" integer NOT NULL,
        "caminho_arquivo" character varying(500) NOT NULL,
        "tipo" character varying(80) NOT NULL,
        "vista" character varying(60),
        "regiao" character varying(120),
        "lado" character varying(40),
        "intensidade_dor" integer,
        "observacao" text,
        "data_foto" date,
        "quality_score" integer,
        "ai_analise" text,
        "ai_limites" text,
        "ai_raw" jsonb,
        "confirmado_por_profissional" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_clinical_photos" PRIMARY KEY ("id"),
        CONSTRAINT "FK_clinical_photos_paciente" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id"),
        CONSTRAINT "FK_clinical_photos_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_clinical_photos_paciente_created"
      ON "clinical_photos" ("paciente_id", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_clinical_photos_usuario_created"
      ON "clinical_photos" ("usuario_id", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_clinical_photos_tipo"
      ON "clinical_photos" ("tipo")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clinical_photo_comparisons" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "paciente_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "baseline_photo_id" uuid NOT NULL,
        "followup_photo_id" uuid NOT NULL,
        "regiao" character varying(120),
        "vista" character varying(60),
        "observacao" text,
        "resumo" text,
        "ai_comparacao" text,
        "ai_limites" text,
        "ai_raw" jsonb,
        "confirmado_por_profissional" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_clinical_photo_comparisons" PRIMARY KEY ("id"),
        CONSTRAINT "FK_clinical_photo_comparisons_paciente" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id"),
        CONSTRAINT "FK_clinical_photo_comparisons_baseline" FOREIGN KEY ("baseline_photo_id") REFERENCES "clinical_photos"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_clinical_photo_comparisons_followup" FOREIGN KEY ("followup_photo_id") REFERENCES "clinical_photos"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_clinical_photo_comparisons_paciente_created"
      ON "clinical_photo_comparisons" ("paciente_id", "created_at")
    `);

    await queryRunner.query(`
      ALTER TABLE "anamneses"
      ADD COLUMN IF NOT EXISTS "fenotipo_dor_evidencias" jsonb NOT NULL DEFAULT '{}'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "anamneses" DROP COLUMN IF EXISTS "fenotipo_dor_evidencias"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_clinical_photo_comparisons_paciente_created"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "clinical_photo_comparisons"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_clinical_photos_tipo"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_clinical_photos_usuario_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_clinical_photos_paciente_created"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "clinical_photos"`);
  }
}
