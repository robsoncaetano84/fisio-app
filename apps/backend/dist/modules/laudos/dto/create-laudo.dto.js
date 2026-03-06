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
exports.CreateLaudoDto = void 0;
const class_validator_1 = require("class-validator");
class CreateLaudoDto {
    pacienteId;
    diagnosticoFuncional;
    objetivosCurtoPrazo;
    objetivosMedioPrazo;
    frequenciaSemanal;
    duracaoSemanas;
    condutas;
    planoTratamentoIA;
    criteriosAlta;
}
exports.CreateLaudoDto = CreateLaudoDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'ID do paciente e obrigatorio' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateLaudoDto.prototype, "pacienteId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Diagnostico funcional e obrigatorio' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLaudoDto.prototype, "diagnosticoFuncional", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLaudoDto.prototype, "objetivosCurtoPrazo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLaudoDto.prototype, "objetivosMedioPrazo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(7),
    __metadata("design:type", Number)
], CreateLaudoDto.prototype, "frequenciaSemanal", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(52),
    __metadata("design:type", Number)
], CreateLaudoDto.prototype, "duracaoSemanas", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Condutas e obrigatoria' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLaudoDto.prototype, "condutas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLaudoDto.prototype, "planoTratamentoIA", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLaudoDto.prototype, "criteriosAlta", void 0);
//# sourceMappingURL=create-laudo.dto.js.map