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
exports.AnamneseHistorico = exports.AnamneseHistoricoOrigem = exports.AnamneseHistoricoAcao = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
var AnamneseHistoricoAcao;
(function (AnamneseHistoricoAcao) {
    AnamneseHistoricoAcao["CREATE"] = "CREATE";
    AnamneseHistoricoAcao["UPDATE"] = "UPDATE";
})(AnamneseHistoricoAcao || (exports.AnamneseHistoricoAcao = AnamneseHistoricoAcao = {}));
var AnamneseHistoricoOrigem;
(function (AnamneseHistoricoOrigem) {
    AnamneseHistoricoOrigem["PROFISSIONAL"] = "PROFISSIONAL";
    AnamneseHistoricoOrigem["PACIENTE"] = "PACIENTE";
})(AnamneseHistoricoOrigem || (exports.AnamneseHistoricoOrigem = AnamneseHistoricoOrigem = {}));
let AnamneseHistorico = class AnamneseHistorico extends base_entity_1.BaseEntity {
    anamneseId;
    pacienteId;
    revisao;
    acao;
    origem;
    alteradoPorUsuarioId;
    payload;
};
exports.AnamneseHistorico = AnamneseHistorico;
__decorate([
    (0, typeorm_1.Column)({ name: 'anamnese_id', type: 'uuid' }),
    __metadata("design:type", String)
], AnamneseHistorico.prototype, "anamneseId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paciente_id', type: 'uuid' }),
    __metadata("design:type", String)
], AnamneseHistorico.prototype, "pacienteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'revisao', type: 'int' }),
    __metadata("design:type", Number)
], AnamneseHistorico.prototype, "revisao", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'acao', type: 'enum', enum: AnamneseHistoricoAcao }),
    __metadata("design:type", String)
], AnamneseHistorico.prototype, "acao", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'origem', type: 'enum', enum: AnamneseHistoricoOrigem }),
    __metadata("design:type", String)
], AnamneseHistorico.prototype, "origem", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'alterado_por_usuario_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], AnamneseHistorico.prototype, "alteradoPorUsuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payload', type: 'jsonb' }),
    __metadata("design:type", Object)
], AnamneseHistorico.prototype, "payload", void 0);
exports.AnamneseHistorico = AnamneseHistorico = __decorate([
    (0, typeorm_1.Entity)('anamneses_historico'),
    (0, typeorm_1.Index)('idx_anamneses_historico_anamnese_created', ['anamneseId', 'createdAt']),
    (0, typeorm_1.Index)('idx_anamneses_historico_paciente_created', ['pacienteId', 'createdAt'])
], AnamneseHistorico);
//# sourceMappingURL=anamnese-historico.entity.js.map