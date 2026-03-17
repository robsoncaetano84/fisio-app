import { OmitType } from '@nestjs/mapped-types';
import { CreateAnamneseDto } from './create-anamnese.dto';

export class CreateMyAnamneseDto extends OmitType(CreateAnamneseDto, [
  'pacienteId',
] as const) {}
