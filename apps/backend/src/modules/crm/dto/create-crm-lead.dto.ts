// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// C RE AT E C RM L EA D.D TO
// ==========================================
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CrmLeadChannel, CrmLeadStage } from '../entities/crm-lead.entity';

export class CreateCrmLeadDto {
  @IsString()
  @MaxLength(180)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  empresa?: string;

  @IsOptional()
  @IsEnum(CrmLeadChannel)
  canal?: CrmLeadChannel;

  @IsOptional()
  @IsEnum(CrmLeadStage)
  stage?: CrmLeadStage;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  responsavelNome?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorPotencial?: number;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
