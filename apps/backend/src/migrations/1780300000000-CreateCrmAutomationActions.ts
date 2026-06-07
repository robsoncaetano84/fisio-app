import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCrmAutomationActions1780300000000 implements MigrationInterface {
  name = 'CreateCrmAutomationActions1780300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_automation_actions_type_enum') THEN
          CREATE TYPE "crm_automation_actions_type_enum" AS ENUM (
            'TASK_OVERDUE',
            'LEAD_STALE',
            'PATIENT_NO_EVOLUTION',
            'PATIENT_NO_CHECKIN',
            'PENDING_ANAMNESIS',
            'PENDING_INVITE',
            'LOW_ACTIVATION_ACCOUNT'
          );
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_automation_actions_severity_enum') THEN
          CREATE TYPE "crm_automation_actions_severity_enum" AS ENUM ('HIGH', 'MEDIUM');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_automation_actions_status_enum') THEN
          CREATE TYPE "crm_automation_actions_status_enum" AS ENUM (
            'OPEN',
            'IN_PROGRESS',
            'SNOOZED',
            'DONE',
            'DISMISSED'
          );
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_automation_actions_target_type_enum') THEN
          CREATE TYPE "crm_automation_actions_target_type_enum" AS ENUM (
            'TASK',
            'LEAD',
            'PATIENT',
            'PROFESSIONAL'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crm_automation_actions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "source_key" character varying(180) NOT NULL,
        "type" "crm_automation_actions_type_enum" NOT NULL,
        "severity" "crm_automation_actions_severity_enum" NOT NULL,
        "status" "crm_automation_actions_status_enum" NOT NULL DEFAULT 'OPEN',
        "title" character varying(180) NOT NULL,
        "description" text NOT NULL,
        "cta_label" character varying(80) NOT NULL,
        "target_type" "crm_automation_actions_target_type_enum" NOT NULL,
        "target_id" uuid NOT NULL,
        "responsavel_usuario_id" uuid,
        "sla_due_at" TIMESTAMP,
        "first_seen_at" TIMESTAMP NOT NULL DEFAULT now(),
        "last_seen_at" TIMESTAMP NOT NULL DEFAULT now(),
        "resolved_at" TIMESTAMP,
        "metadata" jsonb,
        "history" jsonb NOT NULL DEFAULT '[]'::jsonb,
        CONSTRAINT "PK_crm_automation_actions_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_crm_automation_actions_source_key"
      ON "crm_automation_actions" ("source_key")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_crm_automation_actions_status_sla"
      ON "crm_automation_actions" ("status", "sla_due_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_crm_automation_actions_type_status"
      ON "crm_automation_actions" ("type", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_crm_automation_actions_target"
      ON "crm_automation_actions" ("target_type", "target_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_crm_automation_actions_target"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_crm_automation_actions_type_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_crm_automation_actions_status_sla"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_crm_automation_actions_source_key"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_automation_actions"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "crm_automation_actions_target_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "crm_automation_actions_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "crm_automation_actions_severity_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "crm_automation_actions_type_enum"`,
    );
  }
}
