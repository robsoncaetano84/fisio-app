"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPacienteAnamneseAuthorization1773709200000 = void 0;
class AddPacienteAnamneseAuthorization1773709200000 {
    name = 'AddPacienteAnamneseAuthorization1773709200000';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "pacientes" ADD COLUMN IF NOT EXISTS "anamnese_liberada_paciente" boolean NOT NULL DEFAULT false`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "pacientes" DROP COLUMN IF EXISTS "anamnese_liberada_paciente"`);
    }
}
exports.AddPacienteAnamneseAuthorization1773709200000 = AddPacienteAnamneseAuthorization1773709200000;
//# sourceMappingURL=1773709200000-AddPacienteAnamneseAuthorization.js.map