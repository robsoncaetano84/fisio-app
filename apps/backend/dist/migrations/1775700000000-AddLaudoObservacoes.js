"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLaudoObservacoes1775700000000 = void 0;
class AddLaudoObservacoes1775700000000 {
    name = 'AddLaudoObservacoes1775700000000';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "laudos" ADD COLUMN IF NOT EXISTS "observacoes" text`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "laudos" DROP COLUMN IF EXISTS "observacoes"`);
    }
}
exports.AddLaudoObservacoes1775700000000 = AddLaudoObservacoes1775700000000;
//# sourceMappingURL=1775700000000-AddLaudoObservacoes.js.map