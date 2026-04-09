"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddConselhoProfToUsuarios1776000000000 = void 0;
class AddConselhoProfToUsuarios1776000000000 {
    name = 'AddConselhoProfToUsuarios1776000000000';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "conselho_prof" character varying(50)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "conselho_prof"`);
    }
}
exports.AddConselhoProfToUsuarios1776000000000 = AddConselhoProfToUsuarios1776000000000;
//# sourceMappingURL=1776000000000-AddConselhoProfToUsuarios.js.map