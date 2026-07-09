import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ExercicioMidiaRevisaoClinicaStatus } from '../entities/exercicio-midia.entity';

export class UpdateExercicioMidiaClinicalReviewDto {
  @IsEnum(ExercicioMidiaRevisaoClinicaStatus)
  status: ExercicioMidiaRevisaoClinicaStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacao?: string;
}
