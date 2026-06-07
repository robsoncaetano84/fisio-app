import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCrmAutomationResponsibleIndex1780400000000 implements MigrationInterface {
  name = 'AddCrmAutomationResponsibleIndex1780400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_crm_automation_actions_responsavel_status_sla"
      ON "crm_automation_actions" ("responsavel_usuario_id", "status", "sla_due_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_crm_automation_actions_responsavel_status_sla"`,
    );
  }
}
