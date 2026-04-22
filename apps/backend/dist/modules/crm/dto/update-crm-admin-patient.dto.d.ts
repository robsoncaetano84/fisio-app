import { EstadoCivil, Sexo } from '../../pacientes/entities/paciente.entity';
export declare class UpdateCrmAdminPatientDto {
    nomeCompleto?: string;
    cpf?: string;
    dataNascimento?: string;
    sexo?: Sexo;
    estadoCivil?: EstadoCivil;
    profissao?: string;
    contatoWhatsapp?: string;
    contatoTelefone?: string;
    contatoEmail?: string;
    enderecoCidade?: string;
    enderecoUf?: string;
    ativo?: boolean;
}
