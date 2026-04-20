"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePatientCheckClickEvents1778200000000 = void 0;
class CreatePatientCheckClickEvents1778200000000 {
    name = 'CreatePatientCheckClickEvents1778200000000';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "patient_check_click_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "professional_id" uuid NOT NULL,
        "patient_id" uuid,
        "source" character varying(40),
        "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_patient_check_click_events_id" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE INDEX "idx_patient_check_click_events_prof_occurred_at"
      ON "patient_check_click_events" ("professional_id", "occurred_at")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      DROP INDEX "public"."idx_patient_check_click_events_prof_occurred_at"
    `);
        await queryRunner.query(`
      DROP TABLE "patient_check_click_events"
    `);
    }
}
exports.CreatePatientCheckClickEvents1778200000000 = CreatePatientCheckClickEvents1778200000000;
//# sourceMappingURL=1778200000000-CreatePatientCheckClickEvents.js.map