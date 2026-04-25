// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// 1771776000000 CREATEC RM TA BL ES
// ==========================================
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCrmTables1771776000000 implements MigrationInterface {
  name = 'CreateCrmTables1771776000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_leads_canal_enum') THEN
          CREATE TYPE "crm_leads_canal_enum" AS ENUM ('SITE', 'WHATSAPP', 'INDICACAO', 'INSTAGRAM', 'OUTRO');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_leads_stage_enum') THEN
          CREATE TYPE "crm_leads_stage_enum" AS ENUM ('NOVO', 'CONTATO', 'PROPOSTA', 'FECHADO');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_tasks_status_enum') THEN
          CREATE TYPE "crm_tasks_status_enum" AS ENUM ('PENDENTE', 'CONCLUIDA');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_interactions_tipo_enum') THEN
          CREATE TYPE "crm_interactions_tipo_enum" AS ENUM ('LIGACAO', 'WHATSAPP', 'PROPOSTA', 'DEMO', 'EMAIL', 'REUNIAO', 'OUTRO');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crm_leads" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "nome" character varying(180) NOT NULL,
        "empresa" character varying(180),
        "canal" "crm_leads_canal_enum" NOT NULL DEFAULT 'OUTRO',
        "stage" "crm_leads_stage_enum" NOT NULL DEFAULT 'NOVO',
        "responsavel_nome" character varying(180),
        "responsavel_usuario_id" uuid,
        "valor_potencial" numeric(12,2) NOT NULL DEFAULT '0',
        "observacoes" text,
        "ativo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_crm_leads_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crm_tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "titulo" character varying(220) NOT NULL,
        "descricao" text,
        "lead_id" uuid,
        "responsavel_nome" character varying(180),
        "responsavel_usuario_id" uuid,
        "due_at" TIMESTAMP,
        "status" "crm_tasks_status_enum" NOT NULL DEFAULT 'PENDENTE',
        "ativo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_crm_tasks_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crm_interactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "lead_id" uuid NOT NULL,
        "tipo" "crm_interactions_tipo_enum" NOT NULL,
        "resumo" text NOT NULL,
        "detalhes" text,
        "responsavel_nome" character varying(180),
        "responsavel_usuario_id" uuid,
        "occurred_at" TIMESTAMP NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_crm_interactions_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "crm_tasks" ADD COLUMN IF NOT EXISTS "ativo" boolean NOT NULL DEFAULT true`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_crm_leads_stage" ON "crm_leads" ("stage")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_crm_leads_updated_at" ON "crm_leads" ("updated_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_crm_tasks_status" ON "crm_tasks" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_crm_tasks_due_at" ON "crm_tasks" ("due_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_crm_interactions_lead_id" ON "crm_interactions" ("lead_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_crm_interactions_occurred_at" ON "crm_interactions" ("occurred_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_crm_interactions_occurred_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_crm_interactions_lead_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_crm_tasks_due_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_crm_tasks_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_crm_leads_updated_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_crm_leads_stage"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_interactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_tasks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_leads"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "crm_interactions_tipo_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "crm_tasks_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "crm_leads_stage_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "crm_leads_canal_enum"`);
  }
}
