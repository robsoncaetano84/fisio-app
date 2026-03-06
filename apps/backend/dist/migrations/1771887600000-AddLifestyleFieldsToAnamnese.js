"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLifestyleFieldsToAnamnese1771887600000 = void 0;
class AddLifestyleFieldsToAnamnese1771887600000 {
    name = 'AddLifestyleFieldsToAnamnese1771887600000';
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "anamneses"
      ADD COLUMN IF NOT EXISTS "horas_sono_media" character varying(100),
      ADD COLUMN IF NOT EXISTS "qualidade_sono" integer,
      ADD COLUMN IF NOT EXISTS "nivel_estresse" integer,
      ADD COLUMN IF NOT EXISTS "humor_predominante" character varying(120),
      ADD COLUMN IF NOT EXISTS "energia_diaria" integer,
      ADD COLUMN IF NOT EXISTS "atividade_fisica_regular" boolean,
      ADD COLUMN IF NOT EXISTS "frequencia_atividade_fisica" character varying(150),
      ADD COLUMN IF NOT EXISTS "apoio_emocional" integer,
      ADD COLUMN IF NOT EXISTS "observacoes_estilo_vida" text
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "anamneses"
      DROP COLUMN IF EXISTS "observacoes_estilo_vida",
      DROP COLUMN IF EXISTS "apoio_emocional",
      DROP COLUMN IF EXISTS "frequencia_atividade_fisica",
      DROP COLUMN IF EXISTS "atividade_fisica_regular",
      DROP COLUMN IF EXISTS "energia_diaria",
      DROP COLUMN IF EXISTS "humor_predominante",
      DROP COLUMN IF EXISTS "nivel_estresse",
      DROP COLUMN IF EXISTS "qualidade_sono",
      DROP COLUMN IF EXISTS "horas_sono_media"
    `);
    }
}
exports.AddLifestyleFieldsToAnamnese1771887600000 = AddLifestyleFieldsToAnamnese1771887600000;
//# sourceMappingURL=1771887600000-AddLifestyleFieldsToAnamnese.js.map