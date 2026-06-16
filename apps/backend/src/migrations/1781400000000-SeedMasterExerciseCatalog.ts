import { MigrationInterface, QueryRunner } from 'typeorm';
import { MASTER_EXERCISE_CATALOG } from '../modules/atividades/exercise-catalog-master.seed';

export class SeedMasterExerciseCatalog1781400000000 implements MigrationInterface {
  name = 'SeedMasterExerciseCatalog1781400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const exercise of MASTER_EXERCISE_CATALOG) {
      await queryRunner.query(
        `
          INSERT INTO "exercicios" (
            "nome", "slug", "regiao_corporal", "categoria", "nivel",
            "objetivo", "descricao", "instrucoes_padrao", "cuidados",
            "contraindicacoes", "imagem_key", "tags", "status", "versao",
            "revisado_em", "ativo"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, $11::jsonb,
            $12, 1, now(), true)
          ON CONFLICT ("slug") DO NOTHING
        `,
        [
          exercise.nome,
          exercise.slug,
          exercise.regiaoCorporal,
          exercise.categoria,
          exercise.nivel,
          exercise.objetivo,
          exercise.descricao,
          exercise.instrucoesPadrao,
          exercise.cuidados,
          exercise.contraindicacoes,
          JSON.stringify(exercise.tags),
          exercise.status,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const exercise of [...MASTER_EXERCISE_CATALOG].reverse()) {
      await queryRunner.query(`DELETE FROM "exercicios" WHERE "slug" = $1`, [
        exercise.slug,
      ]);
    }
  }
}
