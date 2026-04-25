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
exports.CrmLead = exports.CrmLeadChannel = exports.CrmLeadStage = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
var CrmLeadStage;
(function (CrmLeadStage) {
    CrmLeadStage["NOVO"] = "NOVO";
    CrmLeadStage["CONTATO"] = "CONTATO";
    CrmLeadStage["PROPOSTA"] = "PROPOSTA";
    CrmLeadStage["FECHADO"] = "FECHADO";
})(CrmLeadStage || (exports.CrmLeadStage = CrmLeadStage = {}));
var CrmLeadChannel;
(function (CrmLeadChannel) {
    CrmLeadChannel["SITE"] = "SITE";
    CrmLeadChannel["WHATSAPP"] = "WHATSAPP";
    CrmLeadChannel["INDICACAO"] = "INDICACAO";
    CrmLeadChannel["INSTAGRAM"] = "INSTAGRAM";
    CrmLeadChannel["OUTRO"] = "OUTRO";
})(CrmLeadChannel || (exports.CrmLeadChannel = CrmLeadChannel = {}));
let CrmLead = class CrmLead extends base_entity_1.BaseEntity {
    nome;
    empresa;
    canal;
    stage;
    responsavelNome;
    responsavelUsuarioId;
    valorPotencial;
    observacoes;
    ativo;
};
exports.CrmLead = CrmLead;
__decorate([
    (0, typeorm_1.Column)({ length: 180 }),
    __metadata("design:type", String)
], CrmLead.prototype, "nome", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 180, nullable: true }),
    __metadata("design:type", Object)
], CrmLead.prototype, "empresa", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: CrmLeadChannel, default: CrmLeadChannel.OUTRO }),
    __metadata("design:type", String)
], CrmLead.prototype, "canal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: CrmLeadStage, default: CrmLeadStage.NOVO }),
    __metadata("design:type", String)
], CrmLead.prototype, "stage", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        name: 'responsavel_nome',
        length: 180,
        nullable: true,
    }),
    __metadata("design:type", Object)
], CrmLead.prototype, "responsavelNome", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'responsavel_usuario_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], CrmLead.prototype, "responsavelUsuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'valor_potencial',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", String)
], CrmLead.prototype, "valorPotencial", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CrmLead.prototype, "observacoes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], CrmLead.prototype, "ativo", void 0);
exports.CrmLead = CrmLead = __decorate([
    (0, typeorm_1.Entity)('crm_leads'),
    (0, typeorm_1.Index)(['stage']),
    (0, typeorm_1.Index)(['updatedAt'])
], CrmLead);
//# sourceMappingURL=crm-lead.entity.js.map