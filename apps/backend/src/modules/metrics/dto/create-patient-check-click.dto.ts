import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePatientCheckClickDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  source?: string;
}

