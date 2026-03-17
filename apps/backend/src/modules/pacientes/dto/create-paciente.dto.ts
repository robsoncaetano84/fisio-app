// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
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
import { Sexo, EstadoCivil } from '../entities/paciente.entity';

export class CreatePacienteDto {
  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  @IsString()
  nomeCompleto: string;

  @IsNotEmpty({ message: 'CPF é obrigatório' })
  @Length(11, 11, { message: 'CPF deve ter 11 dígitos' })
  cpf: string;

  @IsOptional()
  @IsString()
  rg?: string;

  @IsNotEmpty({ message: 'Data de nascimento é obrigatória' })
  @IsDateString()
  dataNascimento: string;

  @IsNotEmpty({ message: 'Sexo é obrigatório' })
  @IsEnum(Sexo)
  sexo: Sexo;

  @IsOptional()
  @IsEnum(EstadoCivil)
  estadoCivil?: EstadoCivil;

  @IsOptional()
  @IsString()
  profissao?: string;

  @IsNotEmpty({ message: 'Rua é obrigatória' })
  @IsString()
  enderecoRua: string;

  @IsNotEmpty({ message: 'Número é obrigatório' })
  @IsString()
  enderecoNumero: string;

  @IsOptional()
  @IsString()
  enderecoComplemento?: string;

  @IsNotEmpty({ message: 'Bairro é obrigatório' })
  @IsString()
  enderecoBairro: string;

  @IsNotEmpty({ message: 'CEP é obrigatório' })
  @Length(8, 8, { message: 'CEP deve ter 8 dígitos' })
  enderecoCep: string;

  @IsNotEmpty({ message: 'Cidade é obrigatória' })
  @IsString()
  enderecoCidade: string;

  @IsNotEmpty({ message: 'UF é obrigatória' })
  @Length(2, 2, { message: 'UF deve ter 2 caracteres' })
  enderecoUf: string;

  @IsNotEmpty({ message: 'WhatsApp é obrigatório' })
  @Length(10, 11, { message: 'WhatsApp deve ter 10 ou 11 dígitos' })
  contatoWhatsapp: string;

  @IsOptional()
  @Length(10, 11, { message: 'Telefone deve ter 10 ou 11 dígitos' })
  contatoTelefone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  contatoEmail?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Usuario do paciente invalido' })
  pacienteUsuarioId?: string;

  @IsOptional()
  @IsBoolean()
  anamneseLiberadaPaciente?: boolean;
}
