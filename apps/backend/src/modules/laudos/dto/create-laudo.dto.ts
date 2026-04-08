// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// C RE AT E L AU DO.D TO
// ==========================================
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateLaudoDto {
  @IsNotEmpty({ message: 'ID do paciente e obrigatorio' })
  @IsUUID()
  pacienteId: string;

  @IsNotEmpty({ message: 'Diagnostico funcional e obrigatorio' })
  @IsString()
  diagnosticoFuncional: string;

  @IsOptional()
  @IsString()
  objetivosCurtoPrazo?: string;

  @IsOptional()
  @IsString()
  objetivosMedioPrazo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  frequenciaSemanal?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(52)
  duracaoSemanas?: number;

  @IsNotEmpty({ message: 'Condutas e obrigatoria' })
  @IsString()
  condutas: string;

  @IsOptional()
  @IsString()
  exameFisico?: string;

  @IsOptional()
  @IsString()
  planoTratamentoIA?: string;

  @IsOptional()
  @IsString()
  rascunhoProfissional?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsString()
  criteriosAlta?: string;
}


