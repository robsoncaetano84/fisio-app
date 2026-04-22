"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAnamneseClinicalExtensions1778400000000 = void 0;
class AddAnamneseClinicalExtensions1778400000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'anamneses_mecanismo_lesao_enum'
        ) THEN
          CREATE TYPE "public"."anamneses_mecanismo_lesao_enum" AS ENUM(
            'TRAUMA',
            'SOBRECARGA',
            'MISTO',
            'NAO_DEFINIDO'
          );
        END IF;
      END
      $$;
    `);
        await queryRunner.query(`ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "mecanismo_lesao" "public"."anamneses_mecanismo_lesao_enum"`);
        await queryRunner.query(`ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "fatores_piora" text`);
        await queryRunner.query(`ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "historico_esportivo" text`);
        await queryRunner.query(`ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "lesoes_previas" text`);
        await queryRunner.query(`ALTER TABLE "anamneses" ADD COLUMN IF NOT EXISTS "uso_medicamentos" text`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "anamneses" DROP COLUMN IF EXISTS "uso_medicamentos"`);
        await queryRunner.query(`ALTER TABLE "anamneses" DROP COLUMN IF EXISTS "lesoes_previas"`);
        await queryRunner.query(`ALTER TABLE "anamneses" DROP COLUMN IF EXISTS "historico_esportivo"`);
        await queryRunner.query(`ALTER TABLE "anamneses" DROP COLUMN IF EXISTS "fatores_piora"`);
        await queryRunner.query(`ALTER TABLE "anamneses" DROP COLUMN IF EXISTS "mecanismo_lesao"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."anamneses_mecanismo_lesao_enum"`);
    }
}
exports.AddAnamneseClinicalExtensions1778400000000 = AddAnamneseClinicalExtensions1778400000000;
//# sourceMappingURL=1778400000000-AddAnamneseClinicalExtensions.js.map