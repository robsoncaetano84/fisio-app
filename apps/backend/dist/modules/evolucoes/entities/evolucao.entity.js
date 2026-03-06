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
exports.Evolucao = exports.CheckinDificuldade = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
const paciente_entity_1 = require("../../pacientes/entities/paciente.entity");
var CheckinDificuldade;
(function (CheckinDificuldade) {
    CheckinDificuldade["FACIL"] = "FACIL";
    CheckinDificuldade["MEDIO"] = "MEDIO";
    CheckinDificuldade["DIFICIL"] = "DIFICIL";
})(CheckinDificuldade || (exports.CheckinDificuldade = CheckinDificuldade = {}));
let Evolucao = class Evolucao extends base_entity_1.BaseEntity {
    paciente;
    pacienteId;
    data;
    listagens;
    legCheck;
    ajustes;
    orientacoes;
    checkinDor;
    checkinDificuldade;
    checkinObservacao;
    observacoes;
};
exports.Evolucao = Evolucao;
__decorate([
    (0, typeorm_1.ManyToOne)(() => paciente_entity_1.Paciente),
    (0, typeorm_1.JoinColumn)({ name: 'paciente_id' }),
    __metadata("design:type", paciente_entity_1.Paciente)
], Evolucao.prototype, "paciente", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paciente_id' }),
    __metadata("design:type", String)
], Evolucao.prototype, "pacienteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Evolucao.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Evolucao.prototype, "listagens", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'leg_check', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Evolucao.prototype, "legCheck", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Evolucao.prototype, "ajustes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Evolucao.prototype, "orientacoes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'checkin_dor', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Evolucao.prototype, "checkinDor", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'checkin_dificuldade',
        type: 'enum',
        enum: CheckinDificuldade,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Evolucao.prototype, "checkinDificuldade", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'checkin_observacao', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Evolucao.prototype, "checkinObservacao", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Evolucao.prototype, "observacoes", void 0);
exports.Evolucao = Evolucao = __decorate([
    (0, typeorm_1.Entity)('evolucoes'),
    (0, typeorm_1.Index)('IDX_EVOLUCAO_PACIENTE_DATA', ['pacienteId', 'data'])
], Evolucao);
//# sourceMappingURL=evolucao.entity.js.map