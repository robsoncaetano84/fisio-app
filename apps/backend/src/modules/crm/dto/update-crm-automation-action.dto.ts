import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CrmAutomationStatus } from '../entities/crm-automation-action.entity';

export class UpdateCrmAutomationActionDto {
  @IsOptional()
  @IsEnum(CrmAutomationStatus)
  status?: CrmAutomationStatus;

  @IsOptional()
  @Type(() => String)
  @IsDateString()
  slaDueAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsUUID()
  responsavelUsuarioId?: string | null;
}
