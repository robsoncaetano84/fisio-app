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
exports.PacienteExame = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
let PacienteExame = class PacienteExame extends base_entity_1.BaseEntity {
    pacienteId;
    usuarioId;
    nomeOriginal;
    nomeArquivo;
    mimeType;
    tamanhoBytes;
    caminhoArquivo;
    tipoExame;
    observacao;
    dataExame;
};
exports.PacienteExame = PacienteExame;
__decorate([
    (0, typeorm_1.Column)({ name: 'paciente_id', type: 'uuid' }),
    __metadata("design:type", String)
], PacienteExame.prototype, "pacienteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id', type: 'uuid' }),
    __metadata("design:type", String)
], PacienteExame.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nome_original', length: 255 }),
    __metadata("design:type", String)
], PacienteExame.prototype, "nomeOriginal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nome_arquivo', length: 255 }),
    __metadata("design:type", String)
], PacienteExame.prototype, "nomeArquivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mime_type', length: 120 }),
    __metadata("design:type", String)
], PacienteExame.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tamanho_bytes', type: 'integer' }),
    __metadata("design:type", Number)
], PacienteExame.prototype, "tamanhoBytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'caminho_arquivo', length: 500 }),
    __metadata("design:type", String)
], PacienteExame.prototype, "caminhoArquivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_exame', type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", Object)
], PacienteExame.prototype, "tipoExame", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'observacao', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PacienteExame.prototype, "observacao", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'data_exame', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], PacienteExame.prototype, "dataExame", void 0);
exports.PacienteExame = PacienteExame = __decorate([
    (0, typeorm_1.Entity)('paciente_exames'),
    (0, typeorm_1.Index)('IDX_PACIENTE_EXAME_PACIENTE', ['pacienteId']),
    (0, typeorm_1.Index)('IDX_PACIENTE_EXAME_USUARIO', ['usuarioId'])
], PacienteExame);
//# sourceMappingURL=paciente-exame.entity.js.map