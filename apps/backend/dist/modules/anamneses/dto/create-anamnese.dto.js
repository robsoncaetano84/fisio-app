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
exports.CreateAnamneseDto = void 0;
const class_validator_1 = require("class-validator");
const anamnese_entity_1 = require("../entities/anamnese.entity");
class CreateAnamneseDto {
    pacienteId;
    motivoBusca;
    areasAfetadas;
    intensidadeDor;
    descricaoSintomas;
    tempoProblema;
    horaIntensifica;
    inicioProblema;
    eventoEspecifico;
    fatorAlivio;
    problemaAnterior;
    quandoProblemaAnterior;
    tratamentosAnteriores;
    historicoFamiliar;
    limitacoesFuncionais;
    atividadesQuePioram;
    metaPrincipalPaciente;
    horasSonoMedia;
    qualidadeSono;
    nivelEstresse;
    humorPredominante;
    energiaDiaria;
    atividadeFisicaRegular;
    frequenciaAtividadeFisica;
    apoioEmocional;
    observacoesEstiloVida;
}
exports.CreateAnamneseDto = CreateAnamneseDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'ID do paciente é obrigatório' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "pacienteId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Motivo da busca é obrigatório' }),
    (0, class_validator_1.IsEnum)(anamnese_entity_1.MotivoBusca),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "motivoBusca", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateAnamneseDto.prototype, "areasAfetadas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreateAnamneseDto.prototype, "intensidadeDor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "descricaoSintomas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "tempoProblema", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "horaIntensifica", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(anamnese_entity_1.InicioProblema),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "inicioProblema", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "eventoEspecifico", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "fatorAlivio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAnamneseDto.prototype, "problemaAnterior", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "quandoProblemaAnterior", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateAnamneseDto.prototype, "tratamentosAnteriores", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "historicoFamiliar", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "limitacoesFuncionais", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "atividadesQuePioram", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "metaPrincipalPaciente", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "horasSonoMedia", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreateAnamneseDto.prototype, "qualidadeSono", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreateAnamneseDto.prototype, "nivelEstresse", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "humorPredominante", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreateAnamneseDto.prototype, "energiaDiaria", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAnamneseDto.prototype, "atividadeFisicaRegular", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "frequenciaAtividadeFisica", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreateAnamneseDto.prototype, "apoioEmocional", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnamneseDto.prototype, "observacoesEstiloVida", void 0);
//# sourceMappingURL=create-anamnese.dto.js.map