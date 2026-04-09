// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// C RE AT E P AC IE NT E.D TO
// ==========================================
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  Length,
  IsDateString,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import {
  Sexo,
  EstadoCivil,
  PacienteCadastroOrigem,
} from '../entities/paciente.entity';

export class CreatePacienteDto {
  @IsNotEmpty({ message: 'Nome completo e obrigatorio' })
  @IsString()
  nomeCompleto: string;

  @IsNotEmpty({ message: 'CPF e obrigatorio' })
  @Length(11, 11, { message: 'CPF deve ter 11 digitos' })
  cpf: string;

  @IsOptional()
  @IsString()
  rg?: string;

  @IsNotEmpty({ message: 'Data de nascimento e obrigatoria' })
  @IsDateString()
  dataNascimento: string;

  @IsNotEmpty({ message: 'Sexo e obrigatorio' })
  @IsEnum(Sexo)
  sexo: Sexo;

  @IsOptional()
  @IsEnum(EstadoCivil)
  estadoCivil?: EstadoCivil;

  @IsOptional()
  @IsString()
  profissao?: string;

  @IsNotEmpty({ message: 'Rua e obrigatoria' })
  @IsString()
  enderecoRua: string;

  @IsNotEmpty({ message: 'Numero e obrigatorio' })
  @IsString()
  enderecoNumero: string;

  @IsOptional()
  @IsString()
  enderecoComplemento?: string;

  @IsNotEmpty({ message: 'Bairro e obrigatorio' })
  @IsString()
  enderecoBairro: string;

  @IsNotEmpty({ message: 'CEP e obrigatorio' })
  @Length(8, 8, { message: 'CEP deve ter 8 digitos' })
  enderecoCep: string;

  @IsNotEmpty({ message: 'Cidade e obrigatoria' })
  @IsString()
  enderecoCidade: string;

  @IsNotEmpty({ message: 'UF e obrigatoria' })
  @Length(2, 2, { message: 'UF deve ter 2 caracteres' })
  enderecoUf: string;

  @IsNotEmpty({ message: 'WhatsApp e obrigatorio' })
  @Length(10, 11, { message: 'WhatsApp deve ter 10 ou 11 digitos' })
  contatoWhatsapp: string;

  @IsOptional()
  @Length(10, 11, { message: 'Telefone deve ter 10 ou 11 digitos' })
  contatoTelefone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail invalido' })
  contatoEmail?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Usuario do paciente invalido' })
  pacienteUsuarioId?: string;

  @IsOptional()
  @IsBoolean()
  anamneseLiberadaPaciente?: boolean;

  @IsOptional()
  @IsEnum(PacienteCadastroOrigem)
  cadastroOrigem?: PacienteCadastroOrigem;
}
