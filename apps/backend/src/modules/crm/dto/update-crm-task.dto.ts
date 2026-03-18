// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// U PD AT E C RM T AS K.D TO
// ==========================================
import { PartialType } from '@nestjs/mapped-types';
import { CreateCrmTaskDto } from './create-crm-task.dto';

export class UpdateCrmTaskDto extends PartialType(CreateCrmTaskDto) {}
