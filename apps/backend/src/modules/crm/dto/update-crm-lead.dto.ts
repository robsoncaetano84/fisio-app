// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// UPDATE C RM L EA D.DTO
// ==========================================
import { PartialType } from '@nestjs/mapped-types';
import { CreateCrmLeadDto } from './create-crm-lead.dto';

export class UpdateCrmLeadDto extends PartialType(CreateCrmLeadDto) {}
