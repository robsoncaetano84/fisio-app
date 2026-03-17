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
exports.CreatePacienteDto = void 0;
const class_validator_1 = require("class-validator");
const paciente_entity_1 = require("../entities/paciente.entity");
class CreatePacienteDto {
    nomeCompleto;
    cpf;
    rg;
    dataNascimento;
    sexo;
    estadoCivil;
    profissao;
    enderecoRua;
    enderecoNumero;
    enderecoComplemento;
    enderecoBairro;
    enderecoCep;
    enderecoCidade;
    enderecoUf;
    contatoWhatsapp;
    contatoTelefone;
    contatoEmail;
    pacienteUsuarioId;
    anamneseLiberadaPaciente;
}
exports.CreatePacienteDto = CreatePacienteDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Nome completo é obrigatório' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "nomeCompleto", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'CPF é obrigatório' }),
    (0, class_validator_1.Length)(11, 11, { message: 'CPF deve ter 11 dígitos' }),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "cpf", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "rg", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Data de nascimento é obrigatória' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "dataNascimento", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Sexo é obrigatório' }),
    (0, class_validator_1.IsEnum)(paciente_entity_1.Sexo),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "sexo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(paciente_entity_1.EstadoCivil),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "estadoCivil", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "profissao", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Rua é obrigatória' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "enderecoRua", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Número é obrigatório' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "enderecoNumero", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "enderecoComplemento", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Bairro é obrigatório' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "enderecoBairro", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'CEP é obrigatório' }),
    (0, class_validator_1.Length)(8, 8, { message: 'CEP deve ter 8 dígitos' }),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "enderecoCep", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Cidade é obrigatória' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "enderecoCidade", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'UF é obrigatória' }),
    (0, class_validator_1.Length)(2, 2, { message: 'UF deve ter 2 caracteres' }),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "enderecoUf", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'WhatsApp é obrigatório' }),
    (0, class_validator_1.Length)(10, 11, { message: 'WhatsApp deve ter 10 ou 11 dígitos' }),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "contatoWhatsapp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(10, 11, { message: 'Telefone deve ter 10 ou 11 dígitos' }),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "contatoTelefone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'E-mail inválido' }),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "contatoEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'Usuario do paciente invalido' }),
    __metadata("design:type", String)
], CreatePacienteDto.prototype, "pacienteUsuarioId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePacienteDto.prototype, "anamneseLiberadaPaciente", void 0);
//# sourceMappingURL=create-paciente.dto.js.map