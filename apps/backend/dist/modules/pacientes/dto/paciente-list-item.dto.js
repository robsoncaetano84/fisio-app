"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacientePagedResponseDto = exports.PacienteListItemDto = void 0;
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