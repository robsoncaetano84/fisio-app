import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ExerciseImageType } from '../exercise-image-type.enum';
import { ExercicioStatus } from '../entities/exercicio.entity';

export class CreateExercicioCatalogDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  slug?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  regiaoCorporal: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  categoria: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  nivel: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  objetivo: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  descricao?: string;

  @IsString()
  @IsNotEmpty()
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
  imagemKey?: ExerciseImageType | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(ExercicioStatus)
  status?: ExercicioStatus;
}
