import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  buildExerciseLocalization,
  normalizeExerciseTranslations,
} from '../modules/atividades/exercise-catalog-localization';
import { MASTER_EXERCISE_CATALOG } from '../modules/atividades/exercise-catalog-master.seed';
import { PREVIEW_EXERCISE_CATALOG } from '../modules/atividades/exercise-catalog-preview.seed';
import { INITIAL_EXERCISE_CATALOG } from '../modules/atividades/exercicio-catalog.seed';

export class AddExerciseTranslationsAndAccents1781500000000 implements MigrationInterface {
  name = 'AddExerciseTranslationsAndAccents1781500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "exercicios" ADD COLUMN IF NOT EXISTS "translations" jsonb NOT NULL DEFAULT '{}'`,
    );

    const catalog = [
      ...INITIAL_EXERCISE_CATALOG,
      ...PREVIEW_EXERCISE_CATALOG,
      ...MASTER_EXERCISE_CATALOG,
    ];

    for (const exercise of catalog) {
      const localization = buildExerciseLocalization(exercise);
      const pt = localization.pt;
      const translations = normalizeExerciseTranslations(
        localization.translations,
        {
          ...pt,
          slug: exercise.slug,
          regiaoCorporal: exercise.regiaoCorporal,
          categoria: exercise.categoria,
          nivel: exercise.nivel,
        },
      );

      await queryRunner.query(
        `
          UPDATE "exercicios"
          SET
            "nome" = $2,
            "objetivo" = $3,
            "descricao" = NULLIF($4, ''),
            "instrucoes_padrao" = $5,
            "cuidados" = NULLIF($6, ''),
            "contraindicacoes" = NULLIF($7, ''),
            "translations" = $8::jsonb,
            "updated_at" = now()
          WHERE "slug" = $1
        `,
        [
          exercise.slug,
          pt.nome,
          pt.objetivo,
          pt.descricao,
          pt.instrucoesPadrao,
          pt.cuidados,
          pt.contraindicacoes,
          JSON.stringify(translations),
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "exercicios" DROP COLUMN IF EXISTS "translations"`,
    );
  }
}
