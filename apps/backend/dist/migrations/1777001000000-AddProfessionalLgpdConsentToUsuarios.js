"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddProfessionalLgpdConsentToUsuarios1777001000000 = void 0;
class AddProfessionalLgpdConsentToUsuarios1777001000000 {
    name = 'AddProfessionalLgpdConsentToUsuarios1777001000000';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "consent_professional_lgpd_required" boolean NOT NULL DEFAULT false`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "consent_professional_lgpd_required"`);
    }
}
exports.AddProfessionalLgpdConsentToUsuarios1777001000000 = AddProfessionalLgpdConsentToUsuarios1777001000000;
//# sourceMappingURL=1777001000000-AddProfessionalLgpdConsentToUsuarios.js.map