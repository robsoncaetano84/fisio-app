"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddConselhoSiglaUfToUsuarios1776000100000 = void 0;
class AddConselhoSiglaUfToUsuarios1776000100000 {
    name = 'AddConselhoSiglaUfToUsuarios1776000100000';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "conselho_sigla" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "conselho_uf" character varying(2)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "conselho_uf"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "conselho_sigla"`);
    }
}
exports.AddConselhoSiglaUfToUsuarios1776000100000 = AddConselhoSiglaUfToUsuarios1776000100000;
//# sourceMappingURL=1776000100000-AddConselhoSiglaUfToUsuarios.js.map