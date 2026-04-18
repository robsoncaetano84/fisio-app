"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPacienteConsentimentosToUsuarios1777000000000 = void 0;
class AddPacienteConsentimentosToUsuarios1777000000000 {
    name = 'AddPacienteConsentimentosToUsuarios1777000000000';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "consent_terms_required" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "consent_privacy_required" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "consent_research_optional" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "consent_ai_optional" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "consent_accepted_at" TIMESTAMP`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "consent_accepted_at"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "consent_ai_optional"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "consent_research_optional"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "consent_privacy_required"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "consent_terms_required"`);
    }
}
exports.AddPacienteConsentimentosToUsuarios1777000000000 = AddPacienteConsentimentosToUsuarios1777000000000;
//# sourceMappingURL=1777000000000-AddPacienteConsentimentosToUsuarios.js.map