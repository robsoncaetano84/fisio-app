// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// APROVAR PLANO IA.DTO
// Plano revisado/ajustado pelo fisioterapeuta antes de virar atividade.
// ==========================================
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class AprovarPlanoIaItemDto {
  @IsNotEmpty({ message: 'ID do exercicio e obrigatorio' })
  @IsUUID()
  exercicioId: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instrucoesExecucao?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  series?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  repeticoes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(600)
  tempoSegundos?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  frequenciaSemanal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  diaPrescricao?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  ordemNoDia?: number;
}

export class AprovarPlanoIaDto {
  @IsNotEmpty({ message: 'ID do paciente e obrigatorio' })
  @IsUUID()
  pacienteId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AprovarPlanoIaItemDto)
  itens: AprovarPlanoIaItemDto[];
}
