import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePatientCheckClickEvents1778200000000
  implements MigrationInterface
{
  name = 'CreatePatientCheckClickEvents1778200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."idx_patient_check_click_events_prof_occurred_at"
    `);
    await queryRunner.query(`
      DROP TABLE "patient_check_click_events"
    `);
  }
}

