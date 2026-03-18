// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// C RE AT E C RM T AS K.D TO
// ==========================================
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CrmTaskStatus } from '../entities/crm-task.entity';

export class CreateCrmTaskDto {
  @IsString()
  @MaxLength(220)
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  responsavelNome?: string;

  @IsOptional()
  @Type(() => String)
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsEnum(CrmTaskStatus)
  status?: CrmTaskStatus;
}
