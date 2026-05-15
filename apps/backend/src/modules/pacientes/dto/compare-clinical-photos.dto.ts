import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CompareClinicalPhotosDto {
  @IsUUID()
  baselinePhotoId: string;

  @IsUUID()
  followupPhotoId: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  regiao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  vista?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacao?: string;
}
