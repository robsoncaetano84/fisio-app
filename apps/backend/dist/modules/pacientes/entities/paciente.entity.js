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
exports.Paciente = exports.PacienteVinculoStatus = exports.PacienteCadastroOrigem = exports.EstadoCivil = exports.Sexo = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
const usuario_entity_1 = require("../../usuarios/entities/usuario.entity");
var Sexo;
(function (Sexo) {
    Sexo["MASCULINO"] = "MASCULINO";
    Sexo["FEMININO"] = "FEMININO";
    Sexo["OUTRO"] = "OUTRO";
})(Sexo || (exports.Sexo = Sexo = {}));
var EstadoCivil;
(function (EstadoCivil) {
    EstadoCivil["SOLTEIRO"] = "SOLTEIRO";
    EstadoCivil["CASADO"] = "CASADO";
    EstadoCivil["VIUVO"] = "VIUVO";
    EstadoCivil["DIVORCIADO"] = "DIVORCIADO";
    EstadoCivil["UNIAO_ESTAVEL"] = "UNIAO_ESTAVEL";
})(EstadoCivil || (exports.EstadoCivil = EstadoCivil = {}));
var PacienteCadastroOrigem;
(function (PacienteCadastroOrigem) {
    PacienteCadastroOrigem["CADASTRO_ASSISTIDO"] = "CADASTRO_ASSISTIDO";
    PacienteCadastroOrigem["CONVITE_RAPIDO"] = "CONVITE_RAPIDO";
})(PacienteCadastroOrigem || (exports.PacienteCadastroOrigem = PacienteCadastroOrigem = {}));
var PacienteVinculoStatus;
(function (PacienteVinculoStatus) {
    PacienteVinculoStatus["SEM_VINCULO"] = "SEM_VINCULO";
    PacienteVinculoStatus["CONVITE_ENVIADO"] = "CONVITE_ENVIADO";
    PacienteVinculoStatus["VINCULADO"] = "VINCULADO";
    PacienteVinculoStatus["VINCULADO_PENDENTE_COMPLEMENTO"] = "VINCULADO_PENDENTE_COMPLEMENTO";
    PacienteVinculoStatus["BLOQUEADO_CONFLITO"] = "BLOQUEADO_CONFLITO";
})(PacienteVinculoStatus || (exports.PacienteVinculoStatus = PacienteVinculoStatus = {}));
let Paciente = class Paciente extends base_entity_1.BaseEntity {
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
    ativo;
    usuario;
    usuarioId;
    pacienteUsuario;
    pacienteUsuarioId;
    anamneseLiberadaPaciente;
    anamneseSolicitacaoPendente;
    anamneseSolicitacaoEm;
    anamneseSolicitacaoUltimaEm;
    cadastroOrigem;
    vinculoStatus;
    conviteEnviadoEm;
    conviteAceitoEm;
};
exports.Paciente = Paciente;
__decorate([
    (0, typeorm_1.Column)({ name: 'nome_completo', length: 255 }),
    __metadata("design:type", String)
], Paciente.prototype, "nomeCompleto", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 11 }),
    __metadata("design:type", String)
], Paciente.prototype, "cpf", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], Paciente.prototype, "rg", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'data_nascimento', type: 'date' }),
    __metadata("design:type", Date)
], Paciente.prototype, "dataNascimento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: Sexo }),
    __metadata("design:type", String)
], Paciente.prototype, "sexo", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'estado_civil',
        type: 'enum',
        enum: EstadoCivil,
        nullable: true,
    }),
    __metadata("design:type", String)
], Paciente.prototype, "estadoCivil", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Paciente.prototype, "profissao", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'endereco_rua', length: 255 }),
    __metadata("design:type", String)
], Paciente.prototype, "enderecoRua", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'endereco_numero', length: 20 }),
    __metadata("design:type", String)
], Paciente.prototype, "enderecoNumero", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'endereco_complemento', length: 100, nullable: true }),
    __metadata("design:type", String)
], Paciente.prototype, "enderecoComplemento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'endereco_bairro', length: 100 }),
    __metadata("design:type", String)
], Paciente.prototype, "enderecoBairro", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'endereco_cep', length: 8 }),
    __metadata("design:type", String)
], Paciente.prototype, "enderecoCep", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'endereco_cidade', length: 100 }),
    __metadata("design:type", String)
], Paciente.prototype, "enderecoCidade", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'endereco_uf', length: 2 }),
    __metadata("design:type", String)
], Paciente.prototype, "enderecoUf", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contato_whatsapp', length: 11 }),
    __metadata("design:type", String)
], Paciente.prototype, "contatoWhatsapp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contato_telefone', length: 11, nullable: true }),
    __metadata("design:type", String)
], Paciente.prototype, "contatoTelefone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contato_email', length: 255, nullable: true }),
    __metadata("design:type", String)
], Paciente.prototype, "contatoEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Paciente.prototype, "ativo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], Paciente.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id' }),
    __metadata("design:type", String)
], Paciente.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'paciente_usuario_id' }),
    __metadata("design:type", Object)
], Paciente.prototype, "pacienteUsuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paciente_usuario_id', type: 'uuid', nullable: true, unique: true }),
    __metadata("design:type", Object)
], Paciente.prototype, "pacienteUsuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'anamnese_liberada_paciente',
        type: 'boolean',
        default: false,
    }),
    __metadata("design:type", Boolean)
], Paciente.prototype, "anamneseLiberadaPaciente", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'anamnese_solicitacao_pendente',
        type: 'boolean',
        default: false,
    }),
    __metadata("design:type", Boolean)
], Paciente.prototype, "anamneseSolicitacaoPendente", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'anamnese_solicitacao_em', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Paciente.prototype, "anamneseSolicitacaoEm", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'anamnese_solicitacao_ultima_em',
        type: 'timestamp',
        nullable: true,
    }),
    __metadata("design:type", Object)
], Paciente.prototype, "anamneseSolicitacaoUltimaEm", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'cadastro_origem',
        type: 'enum',
        enum: PacienteCadastroOrigem,
        default: PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
    }),
    __metadata("design:type", String)
], Paciente.prototype, "cadastroOrigem", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'vinculo_status',
        type: 'enum',
        enum: PacienteVinculoStatus,
        default: PacienteVinculoStatus.SEM_VINCULO,
    }),
    __metadata("design:type", String)
], Paciente.prototype, "vinculoStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'convite_enviado_em', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Paciente.prototype, "conviteEnviadoEm", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'convite_aceito_em', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Paciente.prototype, "conviteAceitoEm", void 0);
exports.Paciente = Paciente = __decorate([
    (0, typeorm_1.Entity)('pacientes'),
    (0, typeorm_1.Index)('IDX_PACIENTE_USUARIO_ATIVO', ['usuarioId', 'ativo']),
    (0, typeorm_1.Index)('IDX_PACIENTE_USUARIO_NOME', ['usuarioId', 'nomeCompleto']),
    (0, typeorm_1.Index)('IDX_PACIENTE_PACIENTE_USUARIO', ['pacienteUsuarioId']),
    (0, typeorm_1.Index)('UQ_PACIENTE_USUARIO_CPF', ['usuarioId', 'cpf'], { unique: true })
], Paciente);
//# sourceMappingURL=paciente.entity.js.map