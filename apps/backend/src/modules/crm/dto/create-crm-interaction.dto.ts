// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// C RE AT E C RM I NT ER AC TI ON.D TO
// ==========================================
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CrmInteractionType } from '../entities/crm-interaction.entity';

export class CreateCrmInteractionDto {
  @IsUUID()
  leadId: string;

  @IsEnum(CrmInteractionType)
  tipo: CrmInteractionType;

  @IsString()
  @MaxLength(1000)
  resumo: string;

  @IsOptional()
  @IsString()
  detalhes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  responsavelNome?: string;

  @IsOptional()
  @Type(() => String)
  @IsDateString()
  occurredAt?: string;
}
