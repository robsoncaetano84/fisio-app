import { BaseEntity } from '../../../common/entities/base.entity';
export declare enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER",
    PACIENTE = "PACIENTE"
}
export declare class Usuario extends BaseEntity {
    nome: string;
    email: string;
    senha: string;
    registroProf: string;
    especialidade: string;
    ativo: boolean;
    role: UserRole;
}
