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
exports.CreateAtividadeCheckinDto = void 0;
const class_validator_1 = require("class-validator");
const atividade_checkin_entity_1 = require("../entities/atividade-checkin.entity");
class CreateAtividadeCheckinDto {
    concluiu;
    dorAntes;
    dorDepois;
    dificuldade;
    tempoMinutos;
    melhoriaSessao;
    melhoriaDescricao;
    motivoNaoExecucao;
    feedbackLivre;
}
exports.CreateAtividadeCheckinDto = CreateAtividadeCheckinDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAtividadeCheckinDto.prototype, "concluiu", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreateAtividadeCheckinDto.prototype, "dorAntes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreateAtividadeCheckinDto.prototype, "dorDepois", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(atividade_checkin_entity_1.DificuldadeExecucao),
    __metadata("design:type", String)
], CreateAtividadeCheckinDto.prototype, "dificuldade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(300),
    __metadata("design:type", Number)
], CreateAtividadeCheckinDto.prototype, "tempoMinutos", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(atividade_checkin_entity_1.MelhoriaSessao),
    __metadata("design:type", String)
], CreateAtividadeCheckinDto.prototype, "melhoriaSessao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1500),
    __metadata("design:type", String)
], CreateAtividadeCheckinDto.prototype, "melhoriaDescricao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(600),
    __metadata("design:type", String)
], CreateAtividadeCheckinDto.prototype, "motivoNaoExecucao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1500),
    __metadata("design:type", String)
], CreateAtividadeCheckinDto.prototype, "feedbackLivre", void 0);
//# sourceMappingURL=create-atividade-checkin.dto.js.map