"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCrmForeignKeys1771781400000 = void 0;
class AddCrmForeignKeys1771781400000 {
    name = 'AddCrmForeignKeys1771781400000';
    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_crm_tasks_lead_id" ON "crm_tasks" ("lead_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_crm_tasks_responsavel_usuario_id" ON "crm_tasks" ("responsavel_usuario_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_crm_leads_responsavel_usuario_id" ON "crm_leads" ("responsavel_usuario_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_crm_interactions_responsavel_usuario_id" ON "crm_interactions" ("responsavel_usuario_id")`);
        await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_crm_tasks_lead'
        ) THEN
          ALTER TABLE "crm_tasks"
          ADD CONSTRAINT "FK_crm_tasks_lead"
          FOREIGN KEY ("lead_id") REFERENCES "crm_leads"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
        await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_crm_interactions_lead'
        ) THEN
          ALTER TABLE "crm_interactions"
          ADD CONSTRAINT "FK_crm_interactions_lead"
          FOREIGN KEY ("lead_id") REFERENCES "crm_leads"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
        await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_crm_leads_responsavel_usuario'
        ) THEN
          ALTER TABLE "crm_leads"
          ADD CONSTRAINT "FK_crm_leads_responsavel_usuario"
          FOREIGN KEY ("responsavel_usuario_id") REFERENCES "usuarios"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
        await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_crm_tasks_responsavel_usuario'
        ) THEN
          ALTER TABLE "crm_tasks"
          ADD CONSTRAINT "FK_crm_tasks_responsavel_usuario"
          FOREIGN KEY ("responsavel_usuario_id") REFERENCES "usuarios"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
        await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_crm_interactions_responsavel_usuario'
        ) THEN
          ALTER TABLE "crm_interactions"
          ADD CONSTRAINT "FK_crm_interactions_responsavel_usuario"
          FOREIGN KEY ("responsavel_usuario_id") REFERENCES "usuarios"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "crm_interactions" DROP CONSTRAINT IF EXISTS "FK_crm_interactions_responsavel_usuario"`);
        await queryRunner.query(`ALTER TABLE "crm_tasks" DROP CONSTRAINT IF EXISTS "FK_crm_tasks_responsavel_usuario"`);
        await queryRunner.query(`ALTER TABLE "crm_leads" DROP CONSTRAINT IF EXISTS "FK_crm_leads_responsavel_usuario"`);
        await queryRunner.query(`ALTER TABLE "crm_interactions" DROP CONSTRAINT IF EXISTS "FK_crm_interactions_lead"`);
        await queryRunner.query(`ALTER TABLE "crm_tasks" DROP CONSTRAINT IF EXISTS "FK_crm_tasks_lead"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_crm_interactions_responsavel_usuario_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_crm_leads_responsavel_usuario_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_crm_tasks_responsavel_usuario_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_crm_tasks_lead_id"`);
    }
}
exports.AddCrmForeignKeys1771781400000 = AddCrmForeignKeys1771781400000;
//# sourceMappingURL=1771781400000-AddCrmForeignKeys.js.map