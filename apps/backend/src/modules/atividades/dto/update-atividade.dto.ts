// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// U PD AT E A TI VI DA DE.D TO
// ==========================================
import { PartialType } from '@nestjs/mapped-types';
import { CreateAtividadeDto } from './create-atividade.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateAtividadeDto extends PartialType(CreateAtividadeDto) {
  @IsOptional()
  @IsUUID()
  pacienteId?: string;
}

