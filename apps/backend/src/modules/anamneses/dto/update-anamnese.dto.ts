// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// U PD AT E A NA MN ES E.D TO
// ==========================================
import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import {
  MotivoBusca,
  InicioProblema,
  AreaAfetada,
} from '../entities/anamnese.entity';

export class UpdateAnamneseDto {
  @IsOptional()
  @IsEnum(MotivoBusca)
  motivoBusca?: MotivoBusca;

  @IsOptional()
  @IsArray()
  areasAfetadas?: AreaAfetada[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  intensidadeDor?: number;

  @IsOptional()
  @IsString()
  descricaoSintomas?: string;

  @IsOptional()
  @IsString()
  tempoProblema?: string;

  @IsOptional()
  @IsString()
  horaIntensifica?: string;

  @IsOptional()
  @IsEnum(InicioProblema)
  inicioProblema?: InicioProblema;

  @IsOptional()
  @IsString()
  eventoEspecifico?: string;

  @IsOptional()
  @IsString()
  fatorAlivio?: string;

  @IsOptional()
  @IsBoolean()
  problemaAnterior?: boolean;

  @IsOptional()
  @IsString()
  quandoProblemaAnterior?: string;

  @IsOptional()
  @IsArray()
  tratamentosAnteriores?: string[];

  @IsOptional()
  @IsString()
  historicoFamiliar?: string;

  @IsOptional()
  @IsString()
  horasSonoMedia?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  qualidadeSono?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  nivelEstresse?: number;

  @IsOptional()
  @IsString()
  humorPredominante?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  energiaDiaria?: number;

  @IsOptional()
  @IsBoolean()
  atividadeFisicaRegular?: boolean;

  @IsOptional()
  @IsString()
  frequenciaAtividadeFisica?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  apoioEmocional?: number;

  @IsOptional()
  @IsString()
  observacoesEstiloVida?: string;
}
