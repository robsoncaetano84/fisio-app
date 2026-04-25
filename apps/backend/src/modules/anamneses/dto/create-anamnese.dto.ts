// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// CREATE ANAMNESE.DTO
// ==========================================
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import {
  MotivoBusca,
  InicioProblema,
  AreaAfetada,
  TipoDor,
  MecanismoLesao,
} from '../entities/anamnese.entity';

export class CreateAnamneseDto {
  @IsNotEmpty({ message: 'ID do paciente é obrigatório' })
  @IsUUID()
  pacienteId: string;

  @IsNotEmpty({ message: 'Motivo da busca é obrigatório' })
  @IsEnum(MotivoBusca)
  motivoBusca: MotivoBusca;

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
  @IsEnum(MecanismoLesao)
  mecanismoLesao?: MecanismoLesao;

  @IsOptional()
  @IsString()
  fatoresPiora?: string;

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
  historicoEsportivo?: string;

  @IsOptional()
  @IsString()
  lesoesPrevias?: string;

  @IsOptional()
  @IsString()
  usoMedicamentos?: string;

  @IsOptional()
  @IsString()
  limitacoesFuncionais?: string;

  @IsOptional()
  @IsString()
  atividadesQuePioram?: string;

  @IsOptional()
  @IsString()
  metaPrincipalPaciente?: string;

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
