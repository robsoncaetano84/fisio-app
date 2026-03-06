import { CreateAtividadeDto } from './create-atividade.dto';
declare const UpdateAtividadeDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateAtividadeDto>>;
export declare class UpdateAtividadeDto extends UpdateAtividadeDto_base {
    pacienteId?: string;
}
export {};
