"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddClinicalFlowFilterIndexes1779100000000 = void 0;
class AddClinicalFlowFilterIndexes1779100000000 {
    name = 'AddClinicalFlowFilterIndexes1779100000000';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_CLINICAL_FLOW_EVENTS_OCCURRED_AT"
      ON "clinical_flow_events" ("occurred_at")
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_CLINICAL_FLOW_EVENTS_PROF_PATIENT_OCCURRED_AT"
      ON "clinical_flow_events" ("professional_id", "patient_id", "occurred_at")
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_CLINICAL_FLOW_EVENTS_PROF_STAGE_OCCURRED_AT"
      ON "clinical_flow_events" ("professional_id", "stage", "occurred_at")
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_CLINICAL_FLOW_EVENTS_PROF_EVENT_OCCURRED_AT"
      ON "clinical_flow_events" ("professional_id", "event_type", "occurred_at")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_CLINICAL_FLOW_EVENTS_PROF_EVENT_OCCURRED_AT"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_CLINICAL_FLOW_EVENTS_PROF_STAGE_OCCURRED_AT"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_CLINICAL_FLOW_EVENTS_PROF_PATIENT_OCCURRED_AT"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_CLINICAL_FLOW_EVENTS_OCCURRED_AT"`);
    }
}
exports.AddClinicalFlowFilterIndexes1779100000000 = AddClinicalFlowFilterIndexes1779100000000;
//# sourceMappingURL=1779100000000-AddClinicalFlowFilterIndexes.js.map