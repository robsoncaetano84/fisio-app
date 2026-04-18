import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

type ClinicalFlowStage = 'ANAMNESE' | 'EXAME_FISICO' | 'EVOLUCAO';
type ClinicalFlowEventType =
  | 'STAGE_OPENED'
  | 'STAGE_COMPLETED'
  | 'STAGE_ABANDONED'
  | 'STAGE_BLOCKED';

export class CreateClinicalFlowEventDto {
  @IsEnum({
    ANAMNESE: 'ANAMNESE',
    EXAME_FISICO: 'EXAME_FISICO',
    EVOLUCAO: 'EVOLUCAO',
  })
  stage: ClinicalFlowStage;

  @IsEnum({
    STAGE_OPENED: 'STAGE_OPENED',
    STAGE_COMPLETED: 'STAGE_COMPLETED',
    STAGE_ABANDONED: 'STAGE_ABANDONED',
    STAGE_BLOCKED: 'STAGE_BLOCKED',
  })
  eventType: ClinicalFlowEventType;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000 * 60 * 60 * 6) // 6h
  durationMs?: number;

  @IsOptional()
  @IsString()
  blockedReason?: string;
}
