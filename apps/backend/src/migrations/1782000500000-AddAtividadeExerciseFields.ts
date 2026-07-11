import { MigrationInterface, QueryRunner } from 'typeorm';

// Etapa-38: vincula Atividade ao catalogo de exercicios e carrega imagem/
// instrucoes/aceite. Todas as colunas sao aditivas e nullable (ou com default),
// mantendo compat com atividades atuais em texto livre.
export class AddAtividadeExerciseFields1782000500000 implements MigrationInterface {
  name = 'AddAtividadeExerciseFields1782000500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "atividades"
        ADD COLUMN IF NOT EXISTS "instrucoes_execucao" text,
        ADD COLUMN IF NOT EXISTS "imagem_url" text,
        ADD COLUMN IF NOT EXISTS "imagem_tipo" character varying(80),
        ADD COLUMN IF NOT EXISTS "exercicio_id" uuid,
        ADD COLUMN IF NOT EXISTS "aceite_profissional" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "aceite_profissional_por_usuario_id" uuid,
        ADD COLUMN IF NOT EXISTS "aceite_profissional_em" TIMESTAMP
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_atividade_exercicio'
            AND table_name = 'atividades'
        ) THEN
          ALTER TABLE "atividades"
            ADD CONSTRAINT "FK_atividade_exercicio"
            FOREIGN KEY ("exercicio_id") REFERENCES "exercicios" ("id")
            ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "atividades" DROP CONSTRAINT IF EXISTS "FK_atividade_exercicio"`,
    );
    await queryRunner.query(`
      ALTER TABLE "atividades"
        DROP COLUMN IF EXISTS "aceite_profissional_em",
        DROP COLUMN IF EXISTS "aceite_profissional_por_usuario_id",
        DROP COLUMN IF EXISTS "aceite_profissional",
        DROP COLUMN IF EXISTS "exercicio_id",
        DROP COLUMN IF EXISTS "imagem_tipo",
        DROP COLUMN IF EXISTS "imagem_url",
        DROP COLUMN IF EXISTS "instrucoes_execucao"
    `);
  }
}
