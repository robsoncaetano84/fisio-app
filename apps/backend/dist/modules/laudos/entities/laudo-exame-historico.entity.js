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
exports.LaudoExameHistorico = exports.LaudoExameHistoricoOrigem = exports.LaudoExameHistoricoAcao = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
var LaudoExameHistoricoAcao;
(function (LaudoExameHistoricoAcao) {
    LaudoExameHistoricoAcao["CREATE"] = "CREATE";
    LaudoExameHistoricoAcao["UPDATE"] = "UPDATE";
})(LaudoExameHistoricoAcao || (exports.LaudoExameHistoricoAcao = LaudoExameHistoricoAcao = {}));
var LaudoExameHistoricoOrigem;
(function (LaudoExameHistoricoOrigem) {
    LaudoExameHistoricoOrigem["PROFISSIONAL"] = "PROFISSIONAL";
    LaudoExameHistoricoOrigem["SISTEMA"] = "SISTEMA";
})(LaudoExameHistoricoOrigem || (exports.LaudoExameHistoricoOrigem = LaudoExameHistoricoOrigem = {}));
let LaudoExameHistorico = class LaudoExameHistorico extends base_entity_1.BaseEntity {
    laudoId;
    pacienteId;
    revisao;
    acao;
    origem;
    alteradoPorUsuarioId;
    payload;
};
exports.LaudoExameHistorico = LaudoExameHistorico;
__decorate([
    (0, typeorm_1.Column)({ name: 'laudo_id', type: 'uuid' }),
    __metadata("design:type", String)
], LaudoExameHistorico.prototype, "laudoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paciente_id', type: 'uuid' }),
    __metadata("design:type", String)
], LaudoExameHistorico.prototype, "pacienteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'revisao', type: 'int' }),
    __metadata("design:type", Number)
], LaudoExameHistorico.prototype, "revisao", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'acao',
        type: 'enum',
        enum: LaudoExameHistoricoAcao,
    }),
    __metadata("design:type", String)
], LaudoExameHistorico.prototype, "acao", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'origem',
        type: 'enum',
        enum: LaudoExameHistoricoOrigem,
    }),
    __metadata("design:type", String)
], LaudoExameHistorico.prototype, "origem", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'alterado_por_usuario_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], LaudoExameHistorico.prototype, "alteradoPorUsuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payload', type: 'jsonb' }),
    __metadata("design:type", Object)
], LaudoExameHistorico.prototype, "payload", void 0);
exports.LaudoExameHistorico = LaudoExameHistorico = __decorate([
    (0, typeorm_1.Entity)('laudo_exame_historico')
], LaudoExameHistorico);
//# sourceMappingURL=laudo-exame-historico.entity.js.map