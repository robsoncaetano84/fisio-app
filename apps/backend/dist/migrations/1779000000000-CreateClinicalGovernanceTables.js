"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateClinicalGovernanceTables1779000000000 = void 0;
class CreateClinicalGovernanceTables1779000000000 {
    name = 'CreateClinicalGovernanceTables1779000000000';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clinical_protocol_versions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(80) NOT NULL,
        "version" character varying(40) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT false,
        "definition" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "activated_at" TIMESTAMP,
        "deactivated_at" TIMESTAMP,
        "activated_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clinical_protocol_versions_id" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_clinical_protocol_versions_active"
      ON "clinical_protocol_versions" ("is_active")
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_clinical_protocol_versions_created"
      ON "clinical_protocol_versions" ("created_at")
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "consent_purpose_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "purpose" character varying(60) NOT NULL,
        "accepted" boolean NOT NULL DEFAULT false,
        "accepted_at" TIMESTAMP,
        "protocol_version" character varying(40),
        "source" character varying(40) NOT NULL DEFAULT 'APP',
        "changed_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_consent_purpose_logs_id" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_consent_purpose_logs_user_created"
      ON "consent_purpose_logs" ("user_id", "created_at")
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_consent_purpose_logs_purpose_created"
      ON "consent_purpose_logs" ("purpose", "created_at")
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clinical_audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "actor_id" uuid,
        "actor_role" character varying(40),
        "patient_id" uuid,
        "action_type" character varying(20) NOT NULL,
        "action" character varying(80) NOT NULL,
        "resource_type" character varying(80),
        "resource_id" character varying(120),
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clinical_audit_logs_id" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_clinical_audit_logs_actor_created"
      ON "clinical_audit_logs" ("actor_id", "created_at")
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_clinical_audit_logs_action_created"
      ON "clinical_audit_logs" ("action_type", "created_at")
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_clinical_audit_logs_patient_created"
      ON "clinical_audit_logs" ("patient_id", "created_at")
    `);
        await queryRunner.query(`
      INSERT INTO "clinical_protocol_versions"
      ("name", "version", "is_active", "definition", "activated_at")
      SELECT
        'Protocolo Clinico Base',
        '1.0.0',
        true,
        '{"source":"seed","notes":"baseline protocol version"}'::jsonb,
        now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "clinical_protocol_versions" WHERE "is_active" = true
      )
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_clinical_audit_logs_patient_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_clinical_audit_logs_action_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_clinical_audit_logs_actor_created"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "clinical_audit_logs"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_consent_purpose_logs_purpose_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_consent_purpose_logs_user_created"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "consent_purpose_logs"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_clinical_protocol_versions_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_clinical_protocol_versions_active"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "clinical_protocol_versions"`);
    }
}
exports.CreateClinicalGovernanceTables1779000000000 = CreateClinicalGovernanceTables1779000000000;
//# sourceMappingURL=1779000000000-CreateClinicalGovernanceTables.js.map