import { Sexo, EstadoCivil } from '../entities/paciente.entity';
export declare class CreatePacienteDto {
    nomeCompleto: string;
    cpf: string;
    rg?: string;
    dataNascimento: string;
    sexo: Sexo;
    estadoCivil?: EstadoCivil;
    profissao?: string;
    enderecoRua: string;
    enderecoNumero: string;
    enderecoComplemento?: string;
    enderecoBairro: string;
    enderecoCep: string;
    enderecoCidade: string;
    enderecoUf: string;
    contatoWhatsapp: string;
    contatoTelefone?: string;
    contatoEmail?: string;
    pacienteUsuarioId?: string;
}
