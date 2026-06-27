import { MigrationInterface, QueryRunner } from 'typeorm';

type CervicalExerciseImage = {
  slug: string;
  assetKey: string;
};

const CERVICAL_EXERCISE_IMAGES: CervicalExerciseImage[] = [
  {
    slug: 'retracao-cervical-em-pe-na-parede',
    assetKey: 'RETRACAO_CERVICAL_EM_PE_PAREDE',
  },
  {
    slug: 'retracao-cervical-em-decubito-com-toalha',
    assetKey: 'RETRACAO_CERVICAL_DECUBITO_TOALHA',
  },
  {
    slug: 'flexao-cervical-ativa-curta',
    assetKey: 'FLEXAO_CERVICAL_ATIVA_CURTA',
  },
  {
    slug: 'rotacao-cervical-em-decubito-dorsal',
    assetKey: 'ROTACAO_CERVICAL_DECUBITO_DORSAL',
  },
  {
    slug: 'inclinacao-cervical-sem-apoio-manual',
    assetKey: 'INCLINACAO_CERVICAL_SEM_APOIO_MANUAL',
  },
  {
    slug: 'isometria-cervical-em-flexao-com-mao',
    assetKey: 'ISOMETRIA_CERVICAL_FLEXAO_MAO',
  },
  {
    slug: 'isometria-cervical-em-extensao-na-parede',
    assetKey: 'ISOMETRIA_CERVICAL_EXTENSAO_PAREDE',
  },
  {
    slug: 'isometria-cervical-lateral-bilateral',
    assetKey: 'ISOMETRIA_CERVICAL_LATERAL_BILATERAL',
  },
  {
    slug: 'deslizamento-cervical-com-toalha',
    assetKey: 'DESLIZAMENTO_CERVICAL_TOALHA',
  },
  {
    slug: 'alongamento-elevador-da-escapula-sentado',
    assetKey: 'ALONGAMENTO_ELEVADOR_ESCAPULA_SENTADO',
  },
  {
    slug: 'mobilidade-suboccipital-com-toalha',
    assetKey: 'MOBILIDADE_SUBOCCIPITAL_TOALHA',
  },
  {
    slug: 'controle-ocular-cervical-sentado',
    assetKey: 'CONTROLE_OCULAR_CERVICAL_SENTADO',
  },
  {
    slug: 'protracao-e-retracao-cervical-sentada',
    assetKey: 'PROTRACAO_RETRACAO_CERVICAL_SENTADA',
  },
  {
    slug: 'abertura-mandibular-controlada',
    assetKey: 'ABERTURA_MANDIBULAR_CONTROLADA',
  },
  {
    slug: 'desvio-lateral-mandibular-controlado',
    assetKey: 'DESVIO_LATERAL_MANDIBULAR_CONTROLADO',
  },
  {
    slug: 'protrusao-mandibular-suave',
    assetKey: 'PROTRUSAO_MANDIBULAR_SUAVE',
  },
];

export class AddCervicalMasterExerciseImages1781600000000 implements MigrationInterface {
  name = 'AddCervicalMasterExerciseImages1781600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const item of CERVICAL_EXERCISE_IMAGES) {
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
    for (const item of CERVICAL_EXERCISE_IMAGES) {
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
