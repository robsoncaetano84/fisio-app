"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLaudoSuggestionMetadata1778500000000 = void 0;
class AddLaudoSuggestionMetadata1778500000000 {
    name = 'AddLaudoSuggestionMetadata1778500000000';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "laudos" ADD "sugestao_source" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "laudos" ADD "exames_considerados" integer`);
        await queryRunner.query(`ALTER TABLE "laudos" ADD "exames_com_leitura_ia" integer`);
        await queryRunner.query(`ALTER TABLE "laudos" ADD "sugestao_gerada_em" TIMESTAMP`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "laudos" DROP COLUMN "sugestao_gerada_em"`);
        await queryRunner.query(`ALTER TABLE "laudos" DROP COLUMN "exames_com_leitura_ia"`);
        await queryRunner.query(`ALTER TABLE "laudos" DROP COLUMN "exames_considerados"`);
        await queryRunner.query(`ALTER TABLE "laudos" DROP COLUMN "sugestao_source"`);
    }
}
exports.AddLaudoSuggestionMetadata1778500000000 = AddLaudoSuggestionMetadata1778500000000;
//# sourceMappingURL=1778500000000-AddLaudoSuggestionMetadata.js.map