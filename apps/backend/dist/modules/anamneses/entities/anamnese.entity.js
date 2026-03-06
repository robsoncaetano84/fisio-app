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
exports.Anamnese = exports.InicioProblema = exports.MotivoBusca = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
const paciente_entity_1 = require("../../pacientes/entities/paciente.entity");
var MotivoBusca;
(function (MotivoBusca) {
    MotivoBusca["SINTOMA_EXISTENTE"] = "SINTOMA_EXISTENTE";
    MotivoBusca["PREVENTIVO"] = "PREVENTIVO";
})(MotivoBusca || (exports.MotivoBusca = MotivoBusca = {}));
var InicioProblema;
(function (InicioProblema) {
    InicioProblema["GRADUAL"] = "GRADUAL";
    InicioProblema["REPENTINO"] = "REPENTINO";
    InicioProblema["APOS_EVENTO"] = "APOS_EVENTO";
    InicioProblema["NAO_SABE"] = "NAO_SABE";
})(InicioProblema || (exports.InicioProblema = InicioProblema = {}));
let Anamnese = class Anamnese extends base_entity_1.BaseEntity {
    paciente;
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
};
exports.Anamnese = Anamnese;
__decorate([
    (0, typeorm_1.ManyToOne)(() => paciente_entity_1.Paciente),
    (0, typeorm_1.JoinColumn)({ name: 'paciente_id' }),
    __metadata("design:type", paciente_entity_1.Paciente)
], Anamnese.prototype, "paciente", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paciente_id' }),
    __metadata("design:type", String)
], Anamnese.prototype, "pacienteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'motivo_busca', type: 'enum', enum: MotivoBusca }),
    __metadata("design:type", String)
], Anamnese.prototype, "motivoBusca", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'areas_afetadas', type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], Anamnese.prototype, "areasAfetadas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'intensidade_dor', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Anamnese.prototype, "intensidadeDor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'descricao_sintomas', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Anamnese.prototype, "descricaoSintomas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tempo_problema', length: 100, nullable: true }),
    __metadata("design:type", String)
], Anamnese.prototype, "tempoProblema", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hora_intensifica', length: 255, nullable: true }),
    __metadata("design:type", String)
], Anamnese.prototype, "horaIntensifica", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'inicio_problema',
        type: 'enum',
        enum: InicioProblema,
        nullable: true,
    }),
    __metadata("design:type", String)
], Anamnese.prototype, "inicioProblema", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'evento_especifico', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Anamnese.prototype, "eventoEspecifico", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fator_alivio', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Anamnese.prototype, "fatorAlivio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'problema_anterior', default: false }),
    __metadata("design:type", Boolean)
], Anamnese.prototype, "problemaAnterior", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quando_problema_anterior', length: 255, nullable: true }),
    __metadata("design:type", String)
], Anamnese.prototype, "quandoProblemaAnterior", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tratamentos_anteriores', type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], Anamnese.prototype, "tratamentosAnteriores", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'historico_familiar', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Anamnese.prototype, "historicoFamiliar", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'limitacoes_funcionais', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Anamnese.prototype, "limitacoesFuncionais", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'atividades_que_pioram', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Anamnese.prototype, "atividadesQuePioram", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'meta_principal_paciente', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Anamnese.prototype, "metaPrincipalPaciente", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'horas_sono_media', length: 100, nullable: true }),
    __metadata("design:type", String)
], Anamnese.prototype, "horasSonoMedia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'qualidade_sono', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Anamnese.prototype, "qualidadeSono", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nivel_estresse', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Anamnese.prototype, "nivelEstresse", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'humor_predominante', length: 120, nullable: true }),
    __metadata("design:type", String)
], Anamnese.prototype, "humorPredominante", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'energia_diaria', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Anamnese.prototype, "energiaDiaria", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'atividade_fisica_regular', type: 'boolean', nullable: true }),
    __metadata("design:type", Boolean)
], Anamnese.prototype, "atividadeFisicaRegular", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'frequencia_atividade_fisica', length: 150, nullable: true }),
    __metadata("design:type", String)
], Anamnese.prototype, "frequenciaAtividadeFisica", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'apoio_emocional', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Anamnese.prototype, "apoioEmocional", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'observacoes_estilo_vida', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Anamnese.prototype, "observacoesEstiloVida", void 0);
exports.Anamnese = Anamnese = __decorate([
    (0, typeorm_1.Entity)('anamneses')
], Anamnese);
//# sourceMappingURL=anamnese.entity.js.map