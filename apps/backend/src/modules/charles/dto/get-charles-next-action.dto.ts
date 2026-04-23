import { IsUUID } from 'class-validator';

export class GetCharlesNextActionDto {
  @IsUUID()
  pacienteId: string;
}

