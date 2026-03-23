"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAtividadeAcceptance1774200000000 = void 0;
class AddAtividadeAcceptance1774200000000 {
    name = 'AddAtividadeAcceptance1774200000000';
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "atividades"
      ADD COLUMN IF NOT EXISTS "aceite_profissional" boolean NOT NULL DEFAULT false
    `);
        await queryRunner.query(`
      ALTER TABLE "atividades"
      ADD COLUMN IF NOT EXISTS "aceite_profissional_por_usuario_id" uuid
    `);
        await queryRunner.query(`
      ALTER TABLE "atividades"
      ADD COLUMN IF NOT EXISTS "aceite_profissional_em" timestamp
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "atividades" DROP COLUMN IF EXISTS "aceite_profissional_em"
    `);
        await queryRunner.query(`
      ALTER TABLE "atividades" DROP COLUMN IF EXISTS "aceite_profissional_por_usuario_id"
    `);
        await queryRunner.query(`
      ALTER TABLE "atividades" DROP COLUMN IF EXISTS "aceite_profissional"
    `);
    }
}
exports.AddAtividadeAcceptance1774200000000 = AddAtividadeAcceptance1774200000000;
//# sourceMappingURL=1774200000000-AddAtividadeAcceptance.js.map