import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class GenerateAtividadeAiDto {
  @IsNotEmpty({ message: 'ID do paciente e obrigatorio' })
  @IsUUID()
  pacienteId: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descricao?: string;
}
