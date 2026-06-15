// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// CREATE A TI VI DA DE.D TO
// ==========================================
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Max,
  Min,
} from 'class-validator';

export class CreateAtividadeDto {
  @IsUUID()
  pacienteId: string;

  @IsOptional()
  @IsUUID()
  exercicioId?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  instrucoesExecucao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  imagemTipo?: string;

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
