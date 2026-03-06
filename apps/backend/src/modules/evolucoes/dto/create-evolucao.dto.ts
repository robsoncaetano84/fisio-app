// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// C RE AT E E VO LU CA O.D TO
// ==========================================
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { CheckinDificuldade } from '../entities/evolucao.entity';

export class CreateEvolucaoDto {
  @IsNotEmpty({ message: 'ID do paciente e obrigatorio' })
  @IsUUID()
  pacienteId: string;

  @IsOptional()
  @IsDateString()
  data?: string;

  @IsOptional()
  @IsString()
  listagens?: string;

  @IsOptional()
  @IsString()
  legCheck?: string;

  @IsNotEmpty({ message: 'Ajustes realizados sao obrigatorios' })
  @IsString()
  ajustes: string;

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
