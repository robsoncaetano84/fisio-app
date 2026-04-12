import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
export declare enum Sexo {
    MASCULINO = "MASCULINO",
    FEMININO = "FEMININO",
    OUTRO = "OUTRO"
}
export declare enum EstadoCivil {
    SOLTEIRO = "SOLTEIRO",
    CASADO = "CASADO",
    VIUVO = "VIUVO",
    DIVORCIADO = "DIVORCIADO",
    UNIAO_ESTAVEL = "UNIAO_ESTAVEL"
}
export declare enum PacienteCadastroOrigem {
    CADASTRO_ASSISTIDO = "CADASTRO_ASSISTIDO",
    CONVITE_RAPIDO = "CONVITE_RAPIDO"
}
export declare enum PacienteVinculoStatus {
    SEM_VINCULO = "SEM_VINCULO",
    CONVITE_ENVIADO = "CONVITE_ENVIADO",
    VINCULADO = "VINCULADO",
    VINCULADO_PENDENTE_COMPLEMENTO = "VINCULADO_PENDENTE_COMPLEMENTO",
    BLOQUEADO_CONFLITO = "BLOQUEADO_CONFLITO"
}
export declare class Paciente extends BaseEntity {
    nomeCompleto: string;
    cpf: string;
    rg: string;
    dataNascimento: Date;
    sexo: Sexo;
    estadoCivil: EstadoCivil;
    profissao: string;
    enderecoRua: string;
    enderecoNumero: string;
    enderecoComplemento: string;
    enderecoBairro: string;
    enderecoCep: string;
    enderecoCidade: string;
    enderecoUf: string;
    contatoWhatsapp: string;
    contatoTelefone: string;
    contatoEmail: string;
    ativo: boolean;
    usuario: Usuario;
    usuarioId: string;
    pacienteUsuario: Usuario | null;
    pacienteUsuarioId: string | null;
    anamneseLiberadaPaciente: boolean;
    anamneseSolicitacaoPendente: boolean;
    anamneseSolicitacaoEm: Date | null;
    anamneseSolicitacaoUltimaEm: Date | null;
    cadastroOrigem: PacienteCadastroOrigem;
    vinculoStatus: PacienteVinculoStatus;
    conviteEnviadoEm: Date | null;
    conviteAceitoEm: Date | null;
}
