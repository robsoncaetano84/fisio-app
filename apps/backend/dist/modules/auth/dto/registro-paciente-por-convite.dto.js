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
exports.RegistroPacientePorConviteDto = void 0;
const class_validator_1 = require("class-validator");
class RegistroPacientePorConviteDto {
    conviteToken;
    nome;
    email;
    senha;
    consentTermsRequired;
    consentPrivacyRequired;
    consentResearchOptional;
    consentAiOptional;
}
exports.RegistroPacientePorConviteDto = RegistroPacientePorConviteDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegistroPacientePorConviteDto.prototype, "conviteToken", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegistroPacientePorConviteDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEmail)({ require_tld: false }, { message: 'E-mail invalido' }),
    __metadata("design:type", String)
], RegistroPacientePorConviteDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(8, { message: 'Senha deve ter no minimo 8 caracteres' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'Senha deve conter letra maiuscula, minuscula e numero',
    }),
    __metadata("design:type", String)
], RegistroPacientePorConviteDto.prototype, "senha", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.Equals)(true, { message: 'Aceite dos termos de uso e obrigatorio' }),
    __metadata("design:type", Boolean)
], RegistroPacientePorConviteDto.prototype, "consentTermsRequired", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.Equals)(true, { message: 'Aceite da politica de privacidade e obrigatorio' }),
    __metadata("design:type", Boolean)
], RegistroPacientePorConviteDto.prototype, "consentPrivacyRequired", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RegistroPacientePorConviteDto.prototype, "consentResearchOptional", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RegistroPacientePorConviteDto.prototype, "consentAiOptional", void 0);
//# sourceMappingURL=registro-paciente-por-convite.dto.js.map