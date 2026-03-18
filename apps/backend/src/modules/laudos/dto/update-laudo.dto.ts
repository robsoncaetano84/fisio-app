// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// U PD AT E L AU DO.D TO
// ==========================================
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class UpdateLaudoDto {
  @IsOptional()
  @IsString()
  diagnosticoFuncional?: string;

  @IsOptional()
  @IsString()
  objetivosCurtoPrazo?: string;

  @IsOptional()
  @IsString()
  objetivosMedioPrazo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  frequenciaSemanal?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(52)
  duracaoSemanas?: number;

  @IsOptional()
  @IsString()
  condutas?: string;

  @IsOptional()
  @IsString()
  planoTratamentoIA?: string;

  @IsOptional()
  @IsString()
  criteriosAlta?: string;
}
