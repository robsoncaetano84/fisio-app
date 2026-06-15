import { PartialType } from '@nestjs/mapped-types';
import { CreateExercicioCatalogDto } from './create-exercicio-catalog.dto';

export class UpdateExercicioCatalogDto extends PartialType(
  CreateExercicioCatalogDto,
) {}
