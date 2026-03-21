// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// U PD AT E E VO LU CA O.D TO
// ==========================================
import { IsOptional, IsString, IsDateString, IsInt, Min, Max, IsEnum } from 'class-validator';
import {
  CheckinDificuldade,
  VariacaoStatus,
  AdesaoStatus,
  EvolucaoStatus,
  CondutaStatus,
} from '../entities/evolucao.entity';

export class UpdateEvolucaoDto {
  @IsOptional()
  @IsDateString()
  data?: string;

  @IsOptional()
  @IsString()
  subjetivo?: string;

  @IsOptional()
  @IsString()
  objetivo?: string;

  @IsOptional()
  @IsString()
  avaliacao?: string;

  @IsOptional()
  @IsString()
  plano?: string;

  // Compatibilidade legada (remover apos migracao completa dos clientes)
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
  @IsEnum(VariacaoStatus)
  dorStatus?: VariacaoStatus;

  @IsOptional()
  @IsEnum(VariacaoStatus)
  funcaoStatus?: VariacaoStatus;

  @IsOptional()
  @IsEnum(AdesaoStatus)
  adesaoStatus?: AdesaoStatus;

  @IsOptional()
  @IsEnum(EvolucaoStatus)
  statusEvolucao?: EvolucaoStatus;

  @IsOptional()
  @IsEnum(CondutaStatus)
  condutaStatus?: CondutaStatus;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
