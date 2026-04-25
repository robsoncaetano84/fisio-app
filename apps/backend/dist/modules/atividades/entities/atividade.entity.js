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
exports.Atividade = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
const paciente_entity_1 = require("../../pacientes/entities/paciente.entity");
const usuario_entity_1 = require("../../usuarios/entities/usuario.entity");
const atividade_checkin_entity_1 = require("./atividade-checkin.entity");
let Atividade = class Atividade extends base_entity_1.BaseEntity {
    titulo;
    descricao;
    dataLimite;
    diaPrescricao;
    ordemNoDia;
    repetirSemanal;
    aceiteProfissional;
    aceiteProfissionalPorUsuarioId;
    aceiteProfissionalEm;
    ativo;
    paciente;
    pacienteId;
    usuario;
    usuarioId;
    checkins;
};
exports.Atividade = Atividade;
__decorate([
    (0, typeorm_1.Column)({ length: 140 }),
    __metadata("design:type", String)
], Atividade.prototype, "titulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Atividade.prototype, "descricao", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'data_limite', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Atividade.prototype, "dataLimite", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dia_prescricao', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Atividade.prototype, "diaPrescricao", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ordem_no_dia', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Atividade.prototype, "ordemNoDia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'repetir_semanal', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Atividade.prototype, "repetirSemanal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'aceite_profissional', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Atividade.prototype, "aceiteProfissional", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'aceite_profissional_por_usuario_id',
        type: 'uuid',
        nullable: true,
    }),
    __metadata("design:type", Object)
], Atividade.prototype, "aceiteProfissionalPorUsuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'aceite_profissional_em', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Atividade.prototype, "aceiteProfissionalEm", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Atividade.prototype, "ativo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => paciente_entity_1.Paciente),
    (0, typeorm_1.JoinColumn)({ name: 'paciente_id' }),
    __metadata("design:type", paciente_entity_1.Paciente)
], Atividade.prototype, "paciente", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paciente_id', type: 'uuid' }),
    __metadata("design:type", String)
], Atividade.prototype, "pacienteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], Atividade.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id', type: 'uuid' }),
    __metadata("design:type", String)
], Atividade.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => atividade_checkin_entity_1.AtividadeCheckin, (checkin) => checkin.atividade),
    __metadata("design:type", Array)
], Atividade.prototype, "checkins", void 0);
exports.Atividade = Atividade = __decorate([
    (0, typeorm_1.Entity)('atividades'),
    (0, typeorm_1.Index)('IDX_ATIVIDADE_PACIENTE_STATUS', ['pacienteId', 'ativo'])
], Atividade);
//# sourceMappingURL=atividade.entity.js.map