import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  ClinicalPhotoType,
  ClinicalPhotoView,
} from '../entities/clinical-photo.entity';

export class CreateClinicalPhotoDto {
  @IsOptional()
  @IsIn(Object.values(ClinicalPhotoType))
  tipo?: ClinicalPhotoType;

  @IsOptional()
  @IsIn(Object.values(ClinicalPhotoView))
  vista?: ClinicalPhotoView;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  regiao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  lado?: string;

  @IsOptional()
  intensidadeDor?: number | string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacao?: string;

  @IsOptional()
  @IsDateString()
  dataFoto?: string;
}
