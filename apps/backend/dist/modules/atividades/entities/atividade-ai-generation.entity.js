"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtividadeAiGeneration = void 0;
const typeorm_1 = require("typeorm");
let AtividadeAiGeneration = class AtividadeAiGeneration extends typeorm_1.BaseEntity {
    id;
    pacienteId;
    generatedOn;
    inputHash;
    titulo;
    descricao;
    referencias;
    source;
    model;
    createdAt;
};
exports.AtividadeAiGeneration = AtividadeAiGeneration;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AtividadeAiGeneration.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paciente_id', type: 'uuid' }),
    __metadata("design:type", String)
], AtividadeAiGeneration.prototype, "pacienteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'generated_on', type: 'date' }),
    __metadata("design:type", String)
], AtividadeAiGeneration.prototype, "generatedOn", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'input_hash', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], AtividadeAiGeneration.prototype, "inputHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 140 }),
    __metadata("design:type", String)
], AtividadeAiGeneration.prototype, "titulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AtividadeAiGeneration.prototype, "descricao", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], AtividadeAiGeneration.prototype, "referencias", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, nullable: true }),
    __metadata("design:type", Object)
], AtividadeAiGeneration.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], AtividadeAiGeneration.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamptz', default: () => 'now()' }),
    __metadata("design:type", Date)
], AtividadeAiGeneration.prototype, "createdAt", void 0);
exports.AtividadeAiGeneration = AtividadeAiGeneration = __decorate([
    (0, typeorm_1.Entity)('atividade_ai_generations'),
    (0, typeorm_1.Unique)('uq_atividade_ai_generations_paciente_dia', ['pacienteId', 'generatedOn'])
], AtividadeAiGeneration);
//# sourceMappingURL=atividade-ai-generation.entity.js.map