// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// UPDATE C RM I NT ER AC TI ON.DTO
// ==========================================
import { PartialType } from '@nestjs/mapped-types';
import { CreateCrmInteractionDto } from './create-crm-interaction.dto';

export class UpdateCrmInteractionDto extends PartialType(
  CreateCrmInteractionDto,
) {}
