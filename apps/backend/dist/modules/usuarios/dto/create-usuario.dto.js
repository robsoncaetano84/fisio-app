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
exports.CreateUsuarioDto = void 0;
const class_validator_1 = require("class-validator");
const usuario_entity_1 = require("../entities/usuario.entity");
class CreateUsuarioDto {
    nome;
    email;
    senha;
    conselhoSigla;
    conselhoUf;
    conselhoProf;
    registroProf;
    especialidade;
    role;
}
exports.CreateUsuarioDto = CreateUsuarioDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Nome e obrigatorio' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUsuarioDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'E-mail e obrigatorio' }),
    (0, class_validator_1.IsEmail)({}, { message: 'E-mail invalido' }),
    __metadata("design:type", String)
], CreateUsuarioDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Senha e obrigatoria' }),
    (0, class_validator_1.MinLength)(8, { message: 'Senha deve ter no minimo 8 caracteres' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'Senha deve conter letra maiuscula, minuscula e numero',
    }),
    __metadata("design:type", String)
], CreateUsuarioDto.prototype, "senha", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.role !== usuario_entity_1.UserRole.PACIENTE),
    (0, class_validator_1.IsNotEmpty)({ message: 'Conselho profissional e obrigatorio' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUsuarioDto.prototype, "conselhoSigla", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.role !== usuario_entity_1.UserRole.PACIENTE),
    (0, class_validator_1.IsNotEmpty)({ message: 'UF do conselho e obrigatoria' }),
    (0, class_validator_1.Matches)(/^[A-Z]{2}$/, { message: 'UF do conselho invalida' }),
    __metadata("design:type", String)
], CreateUsuarioDto.prototype, "conselhoUf", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUsuarioDto.prototype, "conselhoProf", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.role !== usuario_entity_1.UserRole.PACIENTE),
    (0, class_validator_1.IsNotEmpty)({ message: 'Registro profissional e obrigatorio' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUsuarioDto.prototype, "registroProf", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUsuarioDto.prototype, "especialidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(usuario_entity_1.UserRole),
    __metadata("design:type", String)
], CreateUsuarioDto.prototype, "role", void 0);
//# sourceMappingURL=create-usuario.dto.js.map