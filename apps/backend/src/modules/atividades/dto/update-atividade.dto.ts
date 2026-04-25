// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// UPDATE ATIVIDADE.DTO
// ==========================================
import { PartialType } from '@nestjs/mapped-types';
import { CreateAtividadeDto } from './create-atividade.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateAtividadeDto extends PartialType(CreateAtividadeDto) {
  @IsOptional()
  @IsUUID()
  pacienteId?: string;
}
