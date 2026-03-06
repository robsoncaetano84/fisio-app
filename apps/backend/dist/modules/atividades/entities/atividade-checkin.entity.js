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
exports.AtividadeCheckin = exports.DificuldadeExecucao = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
const atividade_entity_1 = require("./atividade.entity");
const paciente_entity_1 = require("../../pacientes/entities/paciente.entity");
const usuario_entity_1 = require("../../usuarios/entities/usuario.entity");
var DificuldadeExecucao;
(function (DificuldadeExecucao) {
    DificuldadeExecucao["FACIL"] = "FACIL";
    DificuldadeExecucao["MEDIO"] = "MEDIO";
    DificuldadeExecucao["DIFICIL"] = "DIFICIL";
})(DificuldadeExecucao || (exports.DificuldadeExecucao = DificuldadeExecucao = {}));
let AtividadeCheckin = class AtividadeCheckin extends base_entity_1.BaseEntity {
    concluiu;
    dorAntes;
    dorDepois;
    dificuldade;
    tempoMinutos;
    motivoNaoExecucao;
    feedbackLivre;
    atividade;
    atividadeId;
    paciente;
    pacienteId;
    usuario;
    usuarioId;
};
exports.AtividadeCheckin = AtividadeCheckin;
__decorate([
    (0, typeorm_1.Column)({ name: 'concluiu', default: false }),
    __metadata("design:type", Boolean)
], AtividadeCheckin.prototype, "concluiu", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dor_antes', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], AtividadeCheckin.prototype, "dorAntes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dor_depois', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], AtividadeCheckin.prototype, "dorDepois", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'dificuldade',
        type: 'enum',
        enum: DificuldadeExecucao,
        nullable: true,
    }),
    __metadata("design:type", Object)
], AtividadeCheckin.prototype, "dificuldade", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tempo_minutos', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], AtividadeCheckin.prototype, "tempoMinutos", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'motivo_nao_execucao', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AtividadeCheckin.prototype, "motivoNaoExecucao", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'feedback_livre', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AtividadeCheckin.prototype, "feedbackLivre", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => atividade_entity_1.Atividade),
    (0, typeorm_1.JoinColumn)({ name: 'atividade_id' }),
    __metadata("design:type", atividade_entity_1.Atividade)
], AtividadeCheckin.prototype, "atividade", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'atividade_id', type: 'uuid' }),
    __metadata("design:type", String)
], AtividadeCheckin.prototype, "atividadeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => paciente_entity_1.Paciente),
    (0, typeorm_1.JoinColumn)({ name: 'paciente_id' }),
    __metadata("design:type", paciente_entity_1.Paciente)
], AtividadeCheckin.prototype, "paciente", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paciente_id', type: 'uuid' }),
    __metadata("design:type", String)
], AtividadeCheckin.prototype, "pacienteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], AtividadeCheckin.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id', type: 'uuid' }),
    __metadata("design:type", String)
], AtividadeCheckin.prototype, "usuarioId", void 0);
exports.AtividadeCheckin = AtividadeCheckin = __decorate([
    (0, typeorm_1.Entity)('atividade_checkins'),
    (0, typeorm_1.Index)('IDX_ATIVIDADE_CHECKIN_ATIVIDADE_DATA', ['atividadeId', 'createdAt'])
], AtividadeCheckin);
//# sourceMappingURL=atividade-checkin.entity.js.map