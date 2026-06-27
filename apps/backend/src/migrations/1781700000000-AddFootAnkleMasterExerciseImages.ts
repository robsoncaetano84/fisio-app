import { MigrationInterface, QueryRunner } from 'typeorm';

type FootAnkleExerciseImage = {
  slug: string;
  assetKey: string;
};

const FOOT_ANKLE_EXERCISE_IMAGES: FootAnkleExerciseImage[] = [
  {
    slug: 'dorsiflexao-parede-joelho-a-parede',
    assetKey: 'DORSIFLEXAO_PAREDE_JOELHO_A_PAREDE',
  },
  {
    slug: 'mobilidade-tornozelo-com-faixa-posterior',
    assetKey: 'MOBILIDADE_TORNOZELO_FAIXA_POSTERIOR',
  },
  {
    slug: 'alongamento-gastrocnemio-no-degrau',
    assetKey: 'ALONGAMENTO_GASTROCNEMIO_DEGRAU',
  },
  {
    slug: 'eversao-tornozelo-ativa-sem-faixa',
    assetKey: 'EVERSAO_TORNOZELO_ATIVA_SEM_FAIXA',
  },
  {
    slug: 'inversao-tornozelo-ativa-sem-faixa',
    assetKey: 'INVERSAO_TORNOZELO_ATIVA_SEM_FAIXA',
  },
  {
    slug: 'flexao-extensao-dedos-do-pe',
    assetKey: 'FLEXAO_EXTENSAO_DEDOS_PE',
  },
  {
    slug: 'abducao-dedos-do-pe',
    assetKey: 'ABDUCAO_DEDOS_PE',
  },
  {
    slug: 'elevacao-isolada-do-hallux',
    assetKey: 'ELEVACAO_ISOLADA_HALLUX',
  },
  {
    slug: 'elevacao-dedos-menores-isolada',
    assetKey: 'ELEVACAO_DEDOS_MENORES_ISOLADA',
  },
  {
    slug: 'doming-foot-sentado',
    assetKey: 'DOMING_FOOT_SENTADO',
  },
  {
    slug: 'doming-foot-em-pe',
    assetKey: 'DOMING_FOOT_EM_PE',
  },
  {
    slug: 'elevacao-panturrilha-unilateral-apoio',
    assetKey: 'ELEVACAO_PANTURRILHA_UNILATERAL_APOIO',
  },
  {
    slug: 'elevacao-tibial-na-parede',
    assetKey: 'ELEVACAO_TIBIAL_NA_PAREDE',
  },
];

export class AddFootAnkleMasterExerciseImages1781700000000 implements MigrationInterface {
  name = 'AddFootAnkleMasterExerciseImages1781700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const item of FOOT_ANKLE_EXERCISE_IMAGES) {
      await queryRunner.query(
        `
          UPDATE "exercicios"
          SET "imagem_key" = $2, "updated_at" = now()
          WHERE "slug" = $1
        `,
        [item.slug, item.assetKey],
      );

      await queryRunner.query(
        `
          INSERT INTO "exercicio_midias" (
            "exercicio_id", "asset_key", "tipo", "source_type", "source_url",
            "author", "license", "license_url", "attribution_text",
            "versao", "revisado_em", "ativo", "revisao_clinica_status"
          )
          SELECT
            "id", $2, 'ILUSTRACAO', 'PROPRIA', NULL,
            'Synap', 'PROPRIETARIA_SYNAP', NULL, 'Ilustração própria Synap.',
            1, now(), true, 'PENDENTE'
          FROM "exercicios"
          WHERE "slug" = $1
          ON CONFLICT ("exercicio_id", "asset_key") DO UPDATE
          SET
            "ativo" = true,
            "tipo" = 'ILUSTRACAO',
            "source_type" = 'PROPRIA',
            "source_url" = NULL,
            "author" = 'Synap',
            "license" = 'PROPRIETARIA_SYNAP',
            "license_url" = NULL,
            "attribution_text" = 'Ilustração própria Synap.',
            "revisao_clinica_status" = 'PENDENTE',
            "updated_at" = now()
        `,
        [item.slug, item.assetKey],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const item of FOOT_ANKLE_EXERCISE_IMAGES) {
      await queryRunner.query(
        `
          UPDATE "exercicios"
          SET "imagem_key" = NULL, "updated_at" = now()
          WHERE "slug" = $1 AND "imagem_key" = $2
        `,
        [item.slug, item.assetKey],
      );

      await queryRunner.query(
        `
          DELETE FROM "exercicio_midias"
          WHERE "asset_key" = $1
        `,
        [item.assetKey],
      );
    }
  }
}
