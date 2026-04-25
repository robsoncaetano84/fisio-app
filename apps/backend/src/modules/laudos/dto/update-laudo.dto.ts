// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// UPDATE L AU DO.DTO
// ==========================================
import { IsOptional, IsString, IsInt, IsIn, Min, Max } from 'class-validator';

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
  exameFisico?: string;

  @IsOptional()
  @IsString()
  planoTratamentoIA?: string;

  @IsOptional()
  @IsString()
  rascunhoProfissional?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsString()
  criteriosAlta?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ai', 'rules'])
  sugestaoSource?: 'ai' | 'rules';

  @IsOptional()
  @IsInt()
  @Min(0)
  examesConsiderados?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  examesComLeituraIa?: number;
}
