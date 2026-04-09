// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// U PD AT E P AC IE NT E.D TO
// ==========================================
import {
  IsOptional,
  IsString,
  IsEnum,
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
  PacienteVinculoStatus,
} from '../entities/paciente.entity';

export class UpdatePacienteDto {
  @IsOptional()
  @IsString()
  nomeCompleto?: string;

  @IsOptional()
  @Length(11, 11, { message: 'CPF deve ter 11 digitos' })
  cpf?: string;

  @IsOptional()
  @IsString()
  rg?: string;

  @IsOptional()
  @IsDateString()
  dataNascimento?: string;

  @IsOptional()
  @IsEnum(Sexo)
  sexo?: Sexo;

  @IsOptional()
  @IsEnum(EstadoCivil)
  estadoCivil?: EstadoCivil;

  @IsOptional()
  @IsString()
  profissao?: string;

  @IsOptional()
  @IsString()
  enderecoRua?: string;

  @IsOptional()
  @IsString()
  enderecoNumero?: string;

  @IsOptional()
  @IsString()
  enderecoComplemento?: string;

  @IsOptional()
  @IsString()
  enderecoBairro?: string;

  @IsOptional()
  @Length(8, 8, { message: 'CEP deve ter 8 digitos' })
  enderecoCep?: string;

  @IsOptional()
  @IsString()
  enderecoCidade?: string;

  @IsOptional()
  @Length(2, 2, { message: 'UF deve ter 2 caracteres' })
  enderecoUf?: string;

  @IsOptional()
  @Length(10, 11, { message: 'WhatsApp deve ter 10 ou 11 digitos' })
  contatoWhatsapp?: string;

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

  @IsOptional()
  @IsEnum(PacienteVinculoStatus)
  vinculoStatus?: PacienteVinculoStatus;
}
