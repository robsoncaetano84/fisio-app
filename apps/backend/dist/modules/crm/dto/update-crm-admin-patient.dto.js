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
exports.UpdateCrmAdminPatientDto = void 0;
const class_validator_1 = require("class-validator");
const paciente_entity_1 = require("../../pacientes/entities/paciente.entity");
class UpdateCrmAdminPatientDto {
    nomeCompleto;
    cpf;
    dataNascimento;
    sexo;
    estadoCivil;
    profissao;
    contatoWhatsapp;
    contatoTelefone;
    contatoEmail;
    enderecoCidade;
    enderecoUf;
    ativo;
}
exports.UpdateCrmAdminPatientDto = UpdateCrmAdminPatientDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpdateCrmAdminPatientDto.prototype, "nomeCompleto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(11, 11, { message: 'CPF deve ter 11 digitos' }),
    __metadata("design:type", String)
], UpdateCrmAdminPatientDto.prototype, "cpf", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateCrmAdminPatientDto.prototype, "dataNascimento", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(paciente_entity_1.Sexo),
    __metadata("design:type", String)
], UpdateCrmAdminPatientDto.prototype, "sexo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(paciente_entity_1.EstadoCivil),
    __metadata("design:type", String)
], UpdateCrmAdminPatientDto.prototype, "estadoCivil", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateCrmAdminPatientDto.prototype, "profissao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(10, 11, { message: 'WhatsApp deve ter 10 ou 11 digitos' }),
    __metadata("design:type", String)
], UpdateCrmAdminPatientDto.prototype, "contatoWhatsapp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(10, 11, { message: 'Telefone deve ter 10 ou 11 digitos' }),
    __metadata("design:type", String)
], UpdateCrmAdminPatientDto.prototype, "contatoTelefone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'E-mail invalido' }),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpdateCrmAdminPatientDto.prototype, "contatoEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateCrmAdminPatientDto.prototype, "enderecoCidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(2, 2, { message: 'UF deve ter 2 caracteres' }),
    __metadata("design:type", String)
], UpdateCrmAdminPatientDto.prototype, "enderecoUf", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCrmAdminPatientDto.prototype, "ativo", void 0);
//# sourceMappingURL=update-crm-admin-patient.dto.js.map