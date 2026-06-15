import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ExerciseImageType } from '../exercise-image-type.enum';
import { ExercicioStatus } from '../entities/exercicio.entity';

export class CreateExercicioCatalogDto {
  @IsString()
  @MaxLength(140)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  slug?: string;

  @IsString()
  @MaxLength(80)
  regiaoCorporal: string;

  @IsString()
  @MaxLength(80)
  categoria: string;

  @IsString()
  @MaxLength(40)
  nivel: string;

  @IsString()
  @MaxLength(1000)
  objetivo: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  descricao?: string;

  @IsString()
  @MaxLength(2000)
  instrucoesPadrao: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  cuidados?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  contraindicacoes?: string;

  @IsOptional()
  @IsEnum(ExerciseImageType)
  imagemKey?: ExerciseImageType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(ExercicioStatus)
  status?: ExercicioStatus;
}
