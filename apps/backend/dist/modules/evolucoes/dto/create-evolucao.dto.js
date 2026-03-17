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
exports.CreateEvolucaoDto = void 0;
const class_validator_1 = require("class-validator");
const evolucao_entity_1 = require("../entities/evolucao.entity");
class CreateEvolucaoDto {
    pacienteId;
    data;
    listagens;
    legCheck;
    ajustes;
    orientacoes;
    checkinDor;
    checkinDificuldade;
    checkinObservacao;
    dorStatus;
    funcaoStatus;
    adesaoStatus;
    statusEvolucao;
    condutaStatus;
    observacoes;
}
exports.CreateEvolucaoDto = CreateEvolucaoDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'ID do paciente e obrigatorio' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateEvolucaoDto.prototype, "pacienteId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEvolucaoDto.prototype, "data", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEvolucaoDto.prototype, "listagens", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEvolucaoDto.prototype, "legCheck", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Ajustes realizados sao obrigatorios' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEvolucaoDto.prototype, "ajustes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEvolucaoDto.prototype, "orientacoes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreateEvolucaoDto.prototype, "checkinDor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(evolucao_entity_1.CheckinDificuldade),
    __metadata("design:type", String)
], CreateEvolucaoDto.prototype, "checkinDificuldade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEvolucaoDto.prototype, "checkinObservacao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(evolucao_entity_1.VariacaoStatus),
    __metadata("design:type", String)
], CreateEvolucaoDto.prototype, "dorStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(evolucao_entity_1.VariacaoStatus),
    __metadata("design:type", String)
], CreateEvolucaoDto.prototype, "funcaoStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(evolucao_entity_1.AdesaoStatus),
    __metadata("design:type", String)
], CreateEvolucaoDto.prototype, "adesaoStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(evolucao_entity_1.EvolucaoStatus),
    __metadata("design:type", String)
], CreateEvolucaoDto.prototype, "statusEvolucao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(evolucao_entity_1.CondutaStatus),
    __metadata("design:type", String)
], CreateEvolucaoDto.prototype, "condutaStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEvolucaoDto.prototype, "observacoes", void 0);
//# sourceMappingURL=create-evolucao.dto.js.map