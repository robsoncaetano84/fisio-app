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
exports.UpdatePacienteDto = void 0;
const class_validator_1 = require("class-validator");
const paciente_entity_1 = require("../entities/paciente.entity");
class UpdatePacienteDto {
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
    cadastroOrigem;
    vinculoStatus;
}
exports.UpdatePacienteDto = UpdatePacienteDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "nomeCompleto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(11, 11, { message: 'CPF deve ter 11 digitos' }),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "cpf", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "rg", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "dataNascimento", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(paciente_entity_1.Sexo),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "sexo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(paciente_entity_1.EstadoCivil),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "estadoCivil", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "profissao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "enderecoRua", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "enderecoNumero", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "enderecoComplemento", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "enderecoBairro", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(8, 8, { message: 'CEP deve ter 8 digitos' }),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "enderecoCep", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "enderecoCidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(2, 2, { message: 'UF deve ter 2 caracteres' }),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "enderecoUf", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(10, 11, { message: 'WhatsApp deve ter 10 ou 11 digitos' }),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "contatoWhatsapp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(10, 11, { message: 'Telefone deve ter 10 ou 11 digitos' }),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "contatoTelefone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'E-mail invalido' }),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "contatoEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'Usuario do paciente invalido' }),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "pacienteUsuarioId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePacienteDto.prototype, "anamneseLiberadaPaciente", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(paciente_entity_1.PacienteCadastroOrigem),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "cadastroOrigem", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(paciente_entity_1.PacienteVinculoStatus),
    __metadata("design:type", String)
], UpdatePacienteDto.prototype, "vinculoStatus", void 0);
//# sourceMappingURL=update-paciente.dto.js.map