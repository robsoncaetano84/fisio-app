import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateExameFisicoDto {
  @IsNotEmpty({ message: 'ID do paciente e obrigatorio' })
  @IsUUID()
  pacienteId: string;

  @IsNotEmpty({ message: 'Exame fisico e obrigatorio' })
  @IsString()
  exameFisico: string;

  @IsOptional()
  @IsString()
  diagnosticoFuncional?: string;

  @IsOptional()
  @IsString()
  condutas?: string;
}
