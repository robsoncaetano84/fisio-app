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
exports.CreateCrmLeadDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const crm_lead_entity_1 = require("../entities/crm-lead.entity");
class CreateCrmLeadDto {
    nome;
    empresa;
    canal;
    stage;
    responsavelNome;
    valorPotencial;
    observacoes;
}
exports.CreateCrmLeadDto = CreateCrmLeadDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], CreateCrmLeadDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], CreateCrmLeadDto.prototype, "empresa", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(crm_lead_entity_1.CrmLeadChannel),
    __metadata("design:type", String)
], CreateCrmLeadDto.prototype, "canal", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(crm_lead_entity_1.CrmLeadStage),
    __metadata("design:type", String)
], CreateCrmLeadDto.prototype, "stage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], CreateCrmLeadDto.prototype, "responsavelNome", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCrmLeadDto.prototype, "valorPotencial", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCrmLeadDto.prototype, "observacoes", void 0);
//# sourceMappingURL=create-crm-lead.dto.js.map