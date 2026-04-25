// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// UPDATE C RM T AS K.DTO
// ==========================================
import { PartialType } from '@nestjs/mapped-types';
import { CreateCrmTaskDto } from './create-crm-task.dto';

export class UpdateCrmTaskDto extends PartialType(CreateCrmTaskDto) {}
