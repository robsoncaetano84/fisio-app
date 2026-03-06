import { UserRole } from '../entities/usuario.entity';
export declare class CreateUsuarioDto {
    nome: string;
    email: string;
    senha: string;
    registroProf?: string;
    especialidade?: string;
    role?: UserRole;
}
