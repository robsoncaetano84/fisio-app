"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMelhoriaSessaoToAtividadeCheckin1776500000000 = void 0;
class AddMelhoriaSessaoToAtividadeCheckin1776500000000 {
    name = 'AddMelhoriaSessaoToAtividadeCheckin1776500000000';
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "atividade_checkins"
      ADD COLUMN IF NOT EXISTS "melhoria_sessao" character varying(20),
      ADD COLUMN IF NOT EXISTS "melhoria_descricao" text
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "atividade_checkins"
      DROP COLUMN IF EXISTS "melhoria_descricao",
      DROP COLUMN IF EXISTS "melhoria_sessao"
    `);
    }
}
exports.AddMelhoriaSessaoToAtividadeCheckin1776500000000 = AddMelhoriaSessaoToAtividadeCheckin1776500000000;
//# sourceMappingURL=1776500000000-AddMelhoriaSessaoToAtividadeCheckin.js.map