// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// UPDATE P AC IE NT E.DTO
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
import { Transform } from 'class-transformer';
import {
  Sexo,
  EstadoCivil,
  PacienteCadastroOrigem,
  PacienteVinculoStatus,
} from '../entities/paciente.entity';

const normalizeOptionalString = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

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
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsString()
  enderecoRua?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsString()
  enderecoNumero?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsString()
  enderecoComplemento?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsString()
  enderecoBairro?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeOptionalString(value))
  @Length(8, 8, { message: 'CEP deve ter 8 digitos' })
  enderecoCep?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsString()
  enderecoCidade?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeOptionalString(value))
  @Length(2, 2, { message: 'UF deve ter 2 caracteres' })
  enderecoUf?: string | null;

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
