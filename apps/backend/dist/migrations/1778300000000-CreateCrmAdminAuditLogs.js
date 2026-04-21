"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCrmAdminAuditLogs1778300000000 = void 0;
class CreateCrmAdminAuditLogs1778300000000 {
    name = 'CreateCrmAdminAuditLogs1778300000000';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crm_admin_audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "actor_id" uuid NOT NULL,
        "actor_email" character varying(255) NOT NULL,
        "action" character varying(120) NOT NULL,
        "include_sensitive" boolean NOT NULL DEFAULT false,
        "sensitive_reason" character varying(255) NULL,
        "metadata" jsonb NULL,
        CONSTRAINT "PK_crm_admin_audit_logs_id" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_crm_admin_audit_logs_actor_created"
      ON "crm_admin_audit_logs" ("actor_id", "created_at")
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_crm_admin_audit_logs_action_created"
      ON "crm_admin_audit_logs" ("action", "created_at")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_crm_admin_audit_logs_action_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_crm_admin_audit_logs_actor_created"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "crm_admin_audit_logs"`);
    }
}
exports.CreateCrmAdminAuditLogs1778300000000 = CreateCrmAdminAuditLogs1778300000000;
//# sourceMappingURL=1778300000000-CreateCrmAdminAuditLogs.js.map