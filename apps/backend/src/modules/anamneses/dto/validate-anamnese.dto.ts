import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ValidateAnamneseDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacao?: string;
}
