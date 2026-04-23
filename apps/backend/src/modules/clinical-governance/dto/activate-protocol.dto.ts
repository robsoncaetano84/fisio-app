import { IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActivateProtocolDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  version: string;

  @IsOptional()
  @IsObject()
  definition?: Record<string, any>;
}

