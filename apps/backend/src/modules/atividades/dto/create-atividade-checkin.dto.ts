// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// C RE AT E A TI VI DA DE C HE CK IN.D TO
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
import { DificuldadeExecucao } from '../entities/atividade-checkin.entity';

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
  @IsString()
  @MaxLength(600)
  motivoNaoExecucao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  feedbackLivre?: string;
}

