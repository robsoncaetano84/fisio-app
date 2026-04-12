"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPacienteAnamneseRequest1776400000000 = void 0;
class AddPacienteAnamneseRequest1776400000000 {
    name = 'AddPacienteAnamneseRequest1776400000000';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "anamnese_solicitacao_pendente" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "anamnese_solicitacao_em" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "anamnese_solicitacao_ultima_em" TIMESTAMP`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "pacientes" DROP COLUMN IF EXISTS "anamnese_solicitacao_ultima_em"`);
        await queryRunner.query(`ALTER TABLE "pacientes" DROP COLUMN IF EXISTS "anamnese_solicitacao_em"`);
        await queryRunner.query(`ALTER TABLE "pacientes" DROP COLUMN IF EXISTS "anamnese_solicitacao_pendente"`);
    }
}
exports.AddPacienteAnamneseRequest1776400000000 = AddPacienteAnamneseRequest1776400000000;
//# sourceMappingURL=1776400000000-AddPacienteAnamneseRequest.js.map