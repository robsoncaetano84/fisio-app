// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// CREATE ATIVIDADE CHECKIN DTO
// ==========================================
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DificuldadeExecucao,
  MelhoriaSessao,
} from '../entities/atividade-checkin.entity';

export class CreateAtividadeCheckinDto {
  @IsBoolean()
  concluiu: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  dorAntes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  dorDepois?: number;

  @IsOptional()
  @IsEnum(DificuldadeExecucao)
  dificuldade?: DificuldadeExecucao;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  tempoMinutos?: number;

  @IsOptional()
  @IsEnum(MelhoriaSessao)
  melhoriaSessao?: MelhoriaSessao;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  melhoriaDescricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  motivoNaoExecucao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  feedbackLivre?: string;
}