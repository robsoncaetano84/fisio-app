import { MigrationInterface, QueryRunner } from 'typeorm';
import { PREVIEW_EXERCISE_CATALOG } from '../modules/atividades/exercise-catalog-preview.seed';
import { EXERCISE_IMAGE_TYPES } from '../modules/atividades/exercise-image-type.enum';

export class SeedPreviewExerciseCatalog1781300000000 implements MigrationInterface {
  name = 'SeedPreviewExerciseCatalog1781300000000';

  private readonly allowedImageTypes: readonly string[] = EXERCISE_IMAGE_TYPES;

  private readonly exerciseIds: Record<string, string> = {
    'prancha-frontal-antebraco': '00000001-3434-4000-8000-000000000001',
    'bird-dog-extensao-alternada': '00000002-3434-4000-8000-000000000002',
    'elevacao-perna-reta': '00000003-3434-4000-8000-000000000003',
    'alongamento-posterior-coxa-faixa': '00000004-3434-4000-8000-000000000004',
    'alongamento-piriforme-decubito-dorsal':
      '00000005-3434-4000-8000-000000000005',
    'elevacao-panturrilha-apoio': '00000006-3434-4000-8000-000000000006',
    'dorsiflexao-tornozelo-faixa': '00000007-3434-4000-8000-000000000007',
    'rotacao-externa-ombro-faixa': '00000008-3434-4000-8000-000000000008',
    'remada-sentada-faixa': '00000009-3434-4000-8000-000000000009',
    'abducao-ombro-em-pe': '00000010-3434-4000-8000-000000000010',
    'mobilidade-toracica-quatro-apoios-thread-needle':
      '00000011-3434-4000-8000-000000000011',
    'dead-bug-controle-lombopelvico': '00000012-3434-4000-8000-000000000012',
    'prancha-lateral-joelhos-apoiados': '00000013-3434-4000-8000-000000000013',
    'clamshell-abertura-quadril': '00000014-3434-4000-8000-000000000014',
    'extensao-quadril-quatro-apoios': '00000015-3434-4000-8000-000000000015',
    'step-up-baixo-apoio': '00000016-3434-4000-8000-000000000016',
    'avanco-assistido-curto-apoio': '00000017-3434-4000-8000-000000000017',
    'wall-slide-deslizamento-bracos-parede':
      '00000018-3434-4000-8000-000000000018',
    'pendular-ombro-codman': '00000019-3434-4000-8000-000000000019',
    'flexao-ombro-bastao-decubito': '00000020-3434-4000-8000-000000000020',
    'flexao-extensao-cotovelo-halter': '00000021-3434-4000-8000-000000000021',
    'pronacao-supinacao-antebraco': '00000022-3434-4000-8000-000000000022',
    'oposicao-polegar': '00000023-3434-4000-8000-000000000023',
    'eversao-tornozelo-faixa': '00000024-3434-4000-8000-000000000024',
    'alongamento-panturrilha-parede': '00000025-3434-4000-8000-000000000025',
    'flexao-joelho-em-pe-apoio': '00000026-3434-4000-8000-000000000026',
    'agachamento-isometrico-parede': '00000027-3434-4000-8000-000000000027',
    'ponte-com-marcha-alternada': '00000028-3434-4000-8000-000000000028',
    'elevacao-lateral-perna-em-pe': '00000029-3434-4000-8000-000000000029',
    'respiracao-diafragmatica-decubito': '00000030-3434-4000-8000-000000000030',
    'inclinacao-pelvica-posterior-decubito':
      '00000031-3434-4000-8000-000000000031',
    'joelho-ao-peito-unilateral': '00000032-3434-4000-8000-000000000032',
    'rotacao-lombar-decubito': '00000033-3434-4000-8000-000000000033',
    'isometria-quadriceps-toalha': '00000034-3434-4000-8000-000000000034',
    'extensao-terminal-joelho-faixa': '00000035-3434-4000-8000-000000000035',
    'isometria-adutores-bola': '00000036-3434-4000-8000-000000000036',
    'flexao-plantar-faixa': '00000037-3434-4000-8000-000000000037',
    'inversao-tornozelo-faixa': '00000038-3434-4000-8000-000000000038',
    'circulos-tornozelo-sentado': '00000039-3434-4000-8000-000000000039',
    'extensao-toracica-encosto-cadeira': '00000040-3434-4000-8000-000000000040',
    'alongamento-peitoral-porta': '00000041-3434-4000-8000-000000000041',
    'isometria-flexao-ombro-parede': '00000042-3434-4000-8000-000000000042',
    'isometria-abducao-ombro-parede': '00000043-3434-4000-8000-000000000043',
    'rotacao-interna-ombro-faixa': '00000044-3434-4000-8000-000000000044',
    'extensao-ombro-faixa': '00000045-3434-4000-8000-000000000045',
    'remada-em-pe-faixa': '00000046-3434-4000-8000-000000000046',
    'desvio-radial-ulnar-punho': '00000047-3434-4000-8000-000000000047',
    'extensao-dedos-elastico': '00000048-3434-4000-8000-000000000048',
    'equilibrio-unipodal-apoio': '00000049-3434-4000-8000-000000000049',
    'deslizamento-calcanhar-decubito': '00000050-3434-4000-8000-000000000050',
    'flexao-braco-parede': '00000051-3434-4000-8000-000000000051',
    'soco-serratil-decubito': '00000052-3434-4000-8000-000000000052',
    'relogio-escapular-parede': '00000053-3434-4000-8000-000000000053',
    'elevacao-plano-escapula-scaption': '00000054-3434-4000-8000-000000000054',
    'extensao-cotovelo-faixa': '00000055-3434-4000-8000-000000000055',
    'pull-apart-faixa': '00000056-3434-4000-8000-000000000056',
    'abducao-quadril-faixa-joelhos': '00000057-3434-4000-8000-000000000057',
    'caminhada-lateral-faixa': '00000058-3434-4000-8000-000000000058',
    'dobradica-quadril-bastao': '00000059-3434-4000-8000-000000000059',
    'step-down-baixo': '00000060-3434-4000-8000-000000000060',
    'caminhada-calcanhares': '00000061-3434-4000-8000-000000000061',
    'caminhada-ponta-pes': '00000062-3434-4000-8000-000000000062',
    'short-foot-arco-plantar': '00000063-3434-4000-8000-000000000063',
    'enrugar-toalha-dedos-pe': '00000064-3434-4000-8000-000000000064',
    'rotacao-cervical-sentada': '00000065-3434-4000-8000-000000000065',
    'extensao-cervical-sentada': '00000066-3434-4000-8000-000000000066',
    'marcha-sentada': '00000067-3434-4000-8000-000000000067',
    'extensao-joelho-sentado-longa': '00000068-3434-4000-8000-000000000068',
    'rotacao-tronco-sentada': '00000069-3434-4000-8000-000000000069',
    'apoio-tandem-com-apoio': '00000070-3434-4000-8000-000000000070',
  };

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.replaceImageConstraints(queryRunner, [
      ...this.allowedImageTypes,
    ]);

    for (const exercise of PREVIEW_EXERCISE_CATALOG) {
      await this.seedExercise(queryRunner, exercise);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const exercise of [...PREVIEW_EXERCISE_CATALOG].reverse()) {
      await queryRunner.query(`DELETE FROM "exercicios" WHERE "slug" = $1`, [
        exercise.slug,
      ]);
    }

    await this.replaceImageConstraints(
      queryRunner,
      [...this.allowedImageTypes].filter(
        (imageType) =>
          !PREVIEW_EXERCISE_CATALOG.some(
            (exercise) => String(exercise.imagemKey) === imageType,
          ),
      ),
    );
  }

  private async seedExercise(
    queryRunner: QueryRunner,
    exercise: (typeof PREVIEW_EXERCISE_CATALOG)[number],
  ): Promise<void> {
    await queryRunner.query(
      `
        INSERT INTO "exercicios" (
          "id", "nome", "slug", "regiao_corporal", "categoria", "nivel",
          "objetivo", "descricao", "instrucoes_padrao", "cuidados",
          "contraindicacoes", "imagem_key", "tags", "status", "versao",
          "revisado_em", "ativo"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb,
          $14, 1, now(), true)
        ON CONFLICT ("slug") DO NOTHING
      `,
      [
        this.exerciseIds[exercise.slug],
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
        exercise.imagemKey,
        JSON.stringify(exercise.tags),
        exercise.status,
      ],
    );

    await queryRunner.query(
      `
        INSERT INTO "exercicio_midias" (
          "exercicio_id", "asset_key", "tipo", "source_type", "source_url",
          "author", "license", "license_url", "attribution_text", "versao",
          "revisado_em", "revisao_clinica_status", "ativo"
        )
        SELECT "id", $2::varchar, 'ILUSTRACAO', 'PROPRIA', NULL,
          'Synap', 'PROPRIETARIA_SYNAP', NULL, 'Ilustracao propria Synap.',
          1, now(), 'PENDENTE', true
        FROM "exercicios"
        WHERE "slug" = $1
          AND NOT EXISTS (
            SELECT 1 FROM "exercicio_midias"
            WHERE "exercicio_id" = "exercicios"."id"
              AND "asset_key" = $2::varchar
          )
      `,
      [exercise.slug, exercise.imagemKey],
    );
  }

  private async replaceImageConstraints(
    queryRunner: QueryRunner,
    allowedImageTypes: readonly string[],
  ): Promise<void> {
    const allowedSql = allowedImageTypes
      .map((value) => `'${value}'`)
      .join(', ');

    await queryRunner.query(`
      ALTER TABLE "exercicios"
      DROP CONSTRAINT IF EXISTS "CHK_EXERCICIOS_IMAGEM_KEY_PROPRIA"
    `);

    await queryRunner.query(`
      ALTER TABLE "atividades"
      DROP CONSTRAINT IF EXISTS "CHK_ATIVIDADES_IMAGEM_TIPO_PROPRIA"
    `);

    await queryRunner.query(`
      ALTER TABLE "atividades"
      ADD CONSTRAINT "CHK_ATIVIDADES_IMAGEM_TIPO_PROPRIA"
      CHECK ("imagem_tipo" IS NULL OR "imagem_tipo" IN (${allowedSql}))
    `);

    await queryRunner.query(`
      ALTER TABLE "exercicios"
      ADD CONSTRAINT "CHK_EXERCICIOS_IMAGEM_KEY_PROPRIA"
      CHECK ("imagem_key" IS NULL OR "imagem_key" IN (${allowedSql}))
    `);
  }
}
