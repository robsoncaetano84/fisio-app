import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { EstadoCivil, Sexo } from '../../pacientes/entities/paciente.entity';

export class UpdateCrmAdminPatientDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nomeCompleto?: string;

  @IsOptional()
  @Length(11, 11, { message: 'CPF deve ter 11 digitos' })
  cpf?: string;

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
  @MaxLength(100)
  profissao?: string;

  @IsOptional()
  @Length(10, 11, { message: 'WhatsApp deve ter 10 ou 11 digitos' })
  contatoWhatsapp?: string;

  @IsOptional()
  @Length(10, 11, { message: 'Telefone deve ter 10 ou 11 digitos' })
  contatoTelefone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail invalido' })
  @MaxLength(255)
  contatoEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  enderecoCidade?: string;

  @IsOptional()
  @Length(2, 2, { message: 'UF deve ter 2 caracteres' })
  enderecoUf?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

