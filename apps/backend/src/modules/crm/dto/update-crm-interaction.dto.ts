// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// U PD AT E C RM I NT ER AC TI ON.D TO
// ==========================================
import { PartialType } from '@nestjs/mapped-types';
import { CreateCrmInteractionDto } from './create-crm-interaction.dto';

export class UpdateCrmInteractionDto extends PartialType(CreateCrmInteractionDto) {}
