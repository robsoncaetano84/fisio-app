import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePacienteExameDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  tipoExame?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacao?: string;

  @IsOptional()
  @IsDateString()
  dataExame?: string;
}
