// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// CREATE A TI VI DA DE.D TO
// ==========================================
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Max,
  Min,
} from 'class-validator';
import { ExerciseImageType } from '../exercise-image-type.enum';

export class CreateAtividadeDto {
  @IsUUID()
  pacienteId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  // Etapa-38: prescricao a partir de um exercicio APROVADO do catalogo. O
  // servidor deriva imagemUrl/instrucoes; o cliente nunca envia URL de imagem.
  @IsOptional()
  @IsUUID()
  exercicioId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  instrucoesExecucao?: string;

  @IsOptional()
  @IsEnum(ExerciseImageType)
  imagemTipo?: ExerciseImageType;

  @IsOptional()
  @IsDateString()
  dataLimite?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  diaPrescricao?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  ordemNoDia?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  repetirSemanal?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  aceiteProfissional?: boolean;
}
