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
}
