"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateClinicalFlowEvents1778100000000 = void 0;
class CreateClinicalFlowEvents1778100000000 {
    name = 'CreateClinicalFlowEvents1778100000000';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clinical_flow_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "professional_id" uuid NOT NULL,
        "patient_id" uuid NULL,
        "stage" character varying(32) NOT NULL,
        "event_type" character varying(32) NOT NULL,
        "duration_ms" integer NULL,
        "blocked_reason" character varying(80) NULL,
        "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clinical_flow_events_id" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_clinical_flow_events_prof_occurred_at"
      ON "clinical_flow_events" ("professional_id", "occurred_at")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_clinical_flow_events_prof_occurred_at"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "clinical_flow_events"`);
    }
}
exports.CreateClinicalFlowEvents1778100000000 = CreateClinicalFlowEvents1778100000000;
//# sourceMappingURL=1778100000000-CreateClinicalFlowEvents.js.map