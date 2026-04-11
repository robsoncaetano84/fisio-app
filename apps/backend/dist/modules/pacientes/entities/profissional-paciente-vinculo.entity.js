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
exports.ProfissionalPacienteVinculo = exports.ProfissionalPacienteVinculoOrigem = exports.ProfissionalPacienteVinculoStatus = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
const usuario_entity_1 = require("../../usuarios/entities/usuario.entity");
const paciente_entity_1 = require("./paciente.entity");
var ProfissionalPacienteVinculoStatus;
(function (ProfissionalPacienteVinculoStatus) {
    ProfissionalPacienteVinculoStatus["ATIVO"] = "ATIVO";
    ProfissionalPacienteVinculoStatus["ENCERRADO"] = "ENCERRADO";
})(ProfissionalPacienteVinculoStatus || (exports.ProfissionalPacienteVinculoStatus = ProfissionalPacienteVinculoStatus = {}));
var ProfissionalPacienteVinculoOrigem;
(function (ProfissionalPacienteVinculoOrigem) {
    ProfissionalPacienteVinculoOrigem["CADASTRO_ASSISTIDO"] = "CADASTRO_ASSISTIDO";
    ProfissionalPacienteVinculoOrigem["CONVITE_RAPIDO"] = "CONVITE_RAPIDO";
    ProfissionalPacienteVinculoOrigem["MANUAL"] = "MANUAL";
})(ProfissionalPacienteVinculoOrigem || (exports.ProfissionalPacienteVinculoOrigem = ProfissionalPacienteVinculoOrigem = {}));
let ProfissionalPacienteVinculo = class ProfissionalPacienteVinculo extends base_entity_1.BaseEntity {
    profissional;
    profissionalId;
    paciente;
    pacienteId;
    pacienteUsuario;
    pacienteUsuarioId;
    status;
    origem;
    endedAt;
};
exports.ProfissionalPacienteVinculo = ProfissionalPacienteVinculo;
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'profissional_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], ProfissionalPacienteVinculo.prototype, "profissional", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profissional_id', type: 'uuid' }),
    __metadata("design:type", String)
], ProfissionalPacienteVinculo.prototype, "profissionalId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => paciente_entity_1.Paciente),
    (0, typeorm_1.JoinColumn)({ name: 'paciente_id' }),
    __metadata("design:type", paciente_entity_1.Paciente)
], ProfissionalPacienteVinculo.prototype, "paciente", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paciente_id', type: 'uuid' }),
    __metadata("design:type", String)
], ProfissionalPacienteVinculo.prototype, "pacienteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'paciente_usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], ProfissionalPacienteVinculo.prototype, "pacienteUsuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paciente_usuario_id', type: 'uuid' }),
    __metadata("design:type", String)
], ProfissionalPacienteVinculo.prototype, "pacienteUsuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'status',
        type: 'enum',
        enum: ProfissionalPacienteVinculoStatus,
        default: ProfissionalPacienteVinculoStatus.ATIVO,
    }),
    __metadata("design:type", String)
], ProfissionalPacienteVinculo.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'origem',
        type: 'enum',
        enum: ProfissionalPacienteVinculoOrigem,
        default: ProfissionalPacienteVinculoOrigem.CADASTRO_ASSISTIDO,
    }),
    __metadata("design:type", String)
], ProfissionalPacienteVinculo.prototype, "origem", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ended_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], ProfissionalPacienteVinculo.prototype, "endedAt", void 0);
exports.ProfissionalPacienteVinculo = ProfissionalPacienteVinculo = __decorate([
    (0, typeorm_1.Entity)('profissional_paciente_vinculos'),
    (0, typeorm_1.Index)('IDX_VINCULO_PROFISSIONAL_STATUS', ['profissionalId', 'status']),
    (0, typeorm_1.Index)('IDX_VINCULO_PACIENTE_USUARIO_STATUS', ['pacienteUsuarioId', 'status']),
    (0, typeorm_1.Index)('IDX_VINCULO_PACIENTE_STATUS', ['pacienteId', 'status'])
], ProfissionalPacienteVinculo);
//# sourceMappingURL=profissional-paciente-vinculo.entity.js.map