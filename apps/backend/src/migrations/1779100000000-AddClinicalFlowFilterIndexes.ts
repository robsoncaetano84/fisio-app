import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClinicalFlowFilterIndexes1779100000000
  implements MigrationInterface
{
  name = 'AddClinicalFlowFilterIndexes1779100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_CLINICAL_FLOW_EVENTS_PROF_EVENT_OCCURRED_AT"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_CLINICAL_FLOW_EVENTS_PROF_STAGE_OCCURRED_AT"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_CLINICAL_FLOW_EVENTS_PROF_PATIENT_OCCURRED_AT"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_CLINICAL_FLOW_EVENTS_OCCURRED_AT"`,
    );
  }
}

