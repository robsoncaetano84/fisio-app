// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
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
import { CheckinDificuldade, VariacaoStatus, AdesaoStatus, EvolucaoStatus, CondutaStatus } from '../entities/evolucao.entity';

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
