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
exports.CreateCrmTaskDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const crm_task_entity_1 = require("../entities/crm-task.entity");
class CreateCrmTaskDto {
    titulo;
    descricao;
    leadId;
    responsavelNome;
    dueAt;
    status;
}
exports.CreateCrmTaskDto = CreateCrmTaskDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(220),
    __metadata("design:type", String)
], CreateCrmTaskDto.prototype, "titulo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCrmTaskDto.prototype, "descricao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCrmTaskDto.prototype, "leadId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], CreateCrmTaskDto.prototype, "responsavelNome", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => String),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCrmTaskDto.prototype, "dueAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(crm_task_entity_1.CrmTaskStatus),
    __metadata("design:type", String)
], CreateCrmTaskDto.prototype, "status", void 0);
//# sourceMappingURL=create-crm-task.dto.js.map