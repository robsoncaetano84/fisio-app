// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// U PD AT E E VO LU CA O.D TO
// ==========================================
import { IsOptional, IsString, IsDateString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { CheckinDificuldade } from '../entities/evolucao.entity';

export class UpdateEvolucaoDto {
  @IsOptional()
  @IsDateString()
  data?: string;

  @IsOptional()
  @IsString()
  listagens?: string;

  @IsOptional()
  @IsString()
  legCheck?: string;

  @IsOptional()
  @IsString()
  ajustes?: string;

  @IsOptional()
  @IsString()
  orientacoes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  checkinDor?: number;

  @IsOptional()
  @IsEnum(CheckinDificuldade)
  checkinDificuldade?: CheckinDificuldade;

  @IsOptional()
  @IsString()
  checkinObservacao?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
