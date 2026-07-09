import { MigrationInterface, QueryRunner } from 'typeorm';

// Etapa-38: catalogo de exercicios + midias (imagens). Aditivo — cria tabelas
// vazias, nao afeta dados existentes. O catalogo so e exposto por endpoints
// atras de flag (fase 2).
export class CreateExerciciosCatalog1782000400000 implements MigrationInterface {
  name = 'CreateExerciciosCatalog1782000400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exercicios" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "nome" character varying(140) NOT NULL,
        "slug" character varying(160) NOT NULL,
        "regiao_corporal" character varying(80) NOT NULL,
        "categoria" character varying(80) NOT NULL,
        "nivel" character varying(40) NOT NULL,
        "objetivo" text NOT NULL,
        "descricao" text,
        "instrucoes_padrao" text NOT NULL,
        "cuidados" text,
        "contraindicacoes" text,
        "imagem_key" character varying(120),
        "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "translations" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "status" character varying(30) NOT NULL DEFAULT 'APROVADO',
        "versao" integer NOT NULL DEFAULT 1,
        "revisado_por_usuario_id" uuid,
        "revisado_em" TIMESTAMP,
        "ativo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_exercicios" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_EXERCICIO_SLUG" ON "exercicios" ("slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_EXERCICIO_FILTROS" ON "exercicios" ("regiao_corporal", "categoria", "nivel")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exercicio_midias" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "exercicio_id" uuid NOT NULL,
        "asset_key" character varying(120) NOT NULL,
        "tipo" character varying(40) NOT NULL,
        "source_type" character varying(40) NOT NULL,
        "source_url" text,
        "storage_path" character varying(512),
        "thumbnail_url" text,
        "image_url" text,
        "mime_type" character varying(80),
        "width" integer,
        "height" integer,
        "bytes" integer,
        "author" character varying(140),
        "license" character varying(80) NOT NULL,
        "license_url" text,
        "attribution_text" text,
        "versao" integer NOT NULL DEFAULT 1,
        "revisado_por_usuario_id" uuid,
        "revisado_em" TIMESTAMP,
        "revisao_clinica_status" character varying(40) NOT NULL DEFAULT 'PENDENTE',
        "revisao_clinica_observacao" text,
        "revisao_clinica_por_usuario_id" uuid,
        "revisao_clinica_em" TIMESTAMP,
        "ativo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_exercicio_midias" PRIMARY KEY ("id"),
        CONSTRAINT "FK_exercicio_midia_exercicio" FOREIGN KEY ("exercicio_id")
          REFERENCES "exercicios" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_EXERCICIO_MIDIA_EXERCICIO" ON "exercicio_midias" ("exercicio_id", "ativo")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_EXERCICIO_MIDIA_ASSET" ON "exercicio_midias" ("exercicio_id", "asset_key")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "exercicio_midias"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exercicios"`);
  }
}
