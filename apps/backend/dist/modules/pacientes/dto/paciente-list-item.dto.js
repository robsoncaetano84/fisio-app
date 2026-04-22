"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacientePagedResponseDto = exports.PacienteListItemDto = exports.PacienteCicloStatus = void 0;
var PacienteCicloStatus;
(function (PacienteCicloStatus) {
    PacienteCicloStatus["AGUARDANDO_ANAMNESE"] = "AGUARDANDO_ANAMNESE";
    PacienteCicloStatus["EM_TRATAMENTO"] = "EM_TRATAMENTO";
    PacienteCicloStatus["ALTA_CONCLUIDA"] = "ALTA_CONCLUIDA";
})(PacienteCicloStatus || (exports.PacienteCicloStatus = PacienteCicloStatus = {}));
class PacienteListItemDto {
    id;
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
    usuarioId;
    pacienteUsuarioId;
    anamneseLiberadaPaciente;
    anamneseSolicitacaoPendente;
    anamneseSolicitacaoEm;
    anamneseSolicitacaoUltimaEm;
    cadastroOrigem;
    vinculoStatus;
    statusCiclo;
    conviteEnviadoEm;
    conviteAceitoEm;
    createdAt;
    updatedAt;
}
exports.PacienteListItemDto = PacienteListItemDto;
class PacientePagedResponseDto {
    data;
    total;
    page;
    limit;
    hasNext;
}
exports.PacientePagedResponseDto = PacientePagedResponseDto;
//# sourceMappingURL=paciente-list-item.dto.js.map