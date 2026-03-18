// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// U PD AT E C RM L EA D.D TO
// ==========================================
import { PartialType } from '@nestjs/mapped-types';
import { CreateCrmLeadDto } from './create-crm-lead.dto';

export class UpdateCrmLeadDto extends PartialType(CreateCrmLeadDto) {}
