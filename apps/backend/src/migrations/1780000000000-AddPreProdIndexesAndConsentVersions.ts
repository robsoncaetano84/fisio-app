import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPreProdIndexesAndConsentVersions1780000000000 implements MigrationInterface {
  name = 'AddPreProdIndexesAndConsentVersions1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "usuarios"
      ADD COLUMN IF NOT EXISTS "consent_terms_version" character varying(40)
    `);
    await queryRunner.query(`
      ALTER TABLE "usuarios"
      ADD COLUMN IF NOT EXISTS "consent_privacy_version" character varying(40)
    `);
    await queryRunner.query(`
      ALTER TABLE "usuarios"
      ADD COLUMN IF NOT EXISTS "consent_research_version" character varying(40)
    `);
    await queryRunner.query(`
      ALTER TABLE "usuarios"
      ADD COLUMN IF NOT EXISTS "consent_ai_version" character varying(40)
    `);
    await queryRunner.query(`
      ALTER TABLE "usuarios"
      ADD COLUMN IF NOT EXISTS "consent_professional_lgpd_version" character varying(40)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PACIENTES_ATIVO_CREATED"
      ON "pacientes" ("ativo", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PACIENTES_USUARIO_VINCULO_UPDATED"
      ON "pacientes" ("usuario_id", "vinculo_status", "updated_at")
      WHERE "ativo" = true
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PACIENTES_CPF_ATIVO"
      ON "pacientes" ("cpf", "ativo")
      WHERE "paciente_usuario_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_LAUDOS_PACIENTE_UPDATED"
      ON "laudos" ("paciente_id", "updated_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_LAUDOS_STATUS_UPDATED"
      ON "laudos" ("status", "updated_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_LAUDOS_VALIDADO_EM"
      ON "laudos" ("validado_em" DESC)
      WHERE "validado_em" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_EVOLUCOES_STATUS_DATA"
      ON "evolucoes" ("status_evolucao", "data" DESC)
      WHERE "status_evolucao" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ATIVIDADE_CHECKINS_USUARIO_CREATED"
      ON "atividade_checkins" ("usuario_id", "created_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ATIVIDADE_CHECKINS_PACIENTE_CREATED"
      ON "atividade_checkins" ("paciente_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PACIENTE_EXAMES_USUARIO_CREATED"
      ON "paciente_exames" ("usuario_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_CRM_LEADS_STAGE_UPDATED"
      ON "crm_leads" ("stage", "updated_at" DESC)
      WHERE "ativo" = true
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_CRM_LEADS_RESP_UPDATED"
      ON "crm_leads" ("responsavel_usuario_id", "updated_at" DESC)
      WHERE "ativo" = true
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_CRM_TASKS_STATUS_DUE"
      ON "crm_tasks" ("status", "due_at")
      WHERE "ativo" = true
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_CRM_TASKS_RESP_STATUS_DUE"
      ON "crm_tasks" ("responsavel_usuario_id", "status", "due_at")
      WHERE "ativo" = true
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_CRM_INTERACTIONS_LEAD_OCCURRED"
      ON "crm_interactions" ("lead_id", "occurred_at" DESC)
      WHERE "ativo" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_CRM_INTERACTIONS_LEAD_OCCURRED"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_CRM_TASKS_RESP_STATUS_DUE"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_CRM_TASKS_STATUS_DUE"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_CRM_LEADS_RESP_UPDATED"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_CRM_LEADS_STAGE_UPDATED"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_PACIENTE_EXAMES_USUARIO_CREATED"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ATIVIDADE_CHECKINS_PACIENTE_CREATED"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ATIVIDADE_CHECKINS_USUARIO_CREATED"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_EVOLUCOES_STATUS_DATA"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_LAUDOS_VALIDADO_EM"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_LAUDOS_STATUS_UPDATED"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_LAUDOS_PACIENTE_UPDATED"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_PACIENTES_CPF_ATIVO"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_PACIENTES_USUARIO_VINCULO_UPDATED"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_PACIENTES_ATIVO_CREATED"`,
    );

    await queryRunner.query(`
      ALTER TABLE "usuarios"
      DROP COLUMN IF EXISTS "consent_professional_lgpd_version"
    `);
    await queryRunner.query(`
      ALTER TABLE "usuarios"
      DROP COLUMN IF EXISTS "consent_ai_version"
    `);
    await queryRunner.query(`
      ALTER TABLE "usuarios"
      DROP COLUMN IF EXISTS "consent_research_version"
    `);
    await queryRunner.query(`
      ALTER TABLE "usuarios"
      DROP COLUMN IF EXISTS "consent_privacy_version"
    `);
    await queryRunner.query(`
      ALTER TABLE "usuarios"
      DROP COLUMN IF EXISTS "consent_terms_version"
    `);
  }
}
