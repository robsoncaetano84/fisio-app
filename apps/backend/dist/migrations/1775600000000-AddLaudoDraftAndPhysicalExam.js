"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLaudoDraftAndPhysicalExam1775600000000 = void 0;
class AddLaudoDraftAndPhysicalExam1775600000000 {
    name = 'AddLaudoDraftAndPhysicalExam1775600000000';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "laudos" ADD COLUMN IF NOT EXISTS "exame_fisico" text`);
        await queryRunner.query(`ALTER TABLE "laudos" ADD COLUMN IF NOT EXISTS "rascunho_profissional" text`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "laudos" DROP COLUMN IF EXISTS "rascunho_profissional"`);
        await queryRunner.query(`ALTER TABLE "laudos" DROP COLUMN IF EXISTS "exame_fisico"`);
    }
}
exports.AddLaudoDraftAndPhysicalExam1775600000000 = AddLaudoDraftAndPhysicalExam1775600000000;
//# sourceMappingURL=1775600000000-AddLaudoDraftAndPhysicalExam.js.map