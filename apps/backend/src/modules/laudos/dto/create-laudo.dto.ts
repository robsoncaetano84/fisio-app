// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// CREATE L AU DO.DTO
// ==========================================
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class CreateLaudoDto {
  @IsNotEmpty({ message: 'ID do paciente e obrigatorio' })
  @IsUUID()
  pacienteId: string;

  @IsOptional()
  @IsString()
  motivoAvaliacao?: string;

  @IsOptional()
  @IsString()
  historicoClinico?: string;

  @IsOptional()
  @IsString()
  achadosClinicos?: string;

  @IsOptional()
  @IsString()
  diagnosticoFuncional?: string;

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

  @IsOptional()
  @IsString()
  conclusao?: string;

  @IsOptional()
  @IsString()
  condutas?: string;

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

  @IsOptional()
  @IsString()
  @IsIn(['ai', 'rules'])
  sugestaoSource?: 'ai' | 'rules';

  @IsOptional()
  @IsInt()
  @Min(0)
  examesConsiderados?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  examesComLeituraIa?: number;
}
