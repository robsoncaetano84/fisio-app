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
exports.CrmTask = exports.CrmTaskStatus = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
var CrmTaskStatus;
(function (CrmTaskStatus) {
    CrmTaskStatus["PENDENTE"] = "PENDENTE";
    CrmTaskStatus["CONCLUIDA"] = "CONCLUIDA";
})(CrmTaskStatus || (exports.CrmTaskStatus = CrmTaskStatus = {}));
let CrmTask = class CrmTask extends base_entity_1.BaseEntity {
    titulo;
    descricao;
    leadId;
    responsavelNome;
    responsavelUsuarioId;
    dueAt;
    status;
    ativo;
};
exports.CrmTask = CrmTask;
__decorate([
    (0, typeorm_1.Column)({ length: 220 }),
    __metadata("design:type", String)
], CrmTask.prototype, "titulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CrmTask.prototype, "descricao", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lead_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], CrmTask.prototype, "leadId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'responsavel_nome', length: 180, nullable: true }),
    __metadata("design:type", Object)
], CrmTask.prototype, "responsavelNome", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'responsavel_usuario_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], CrmTask.prototype, "responsavelUsuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'due_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], CrmTask.prototype, "dueAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: CrmTaskStatus, default: CrmTaskStatus.PENDENTE }),
    __metadata("design:type", String)
], CrmTask.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], CrmTask.prototype, "ativo", void 0);
exports.CrmTask = CrmTask = __decorate([
    (0, typeorm_1.Entity)('crm_tasks'),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['dueAt'])
], CrmTask);
//# sourceMappingURL=crm-task.entity.js.map