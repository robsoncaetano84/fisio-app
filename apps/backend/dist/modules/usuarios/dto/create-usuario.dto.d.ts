import { UserRole } from '../entities/usuario.entity';
export declare class CreateUsuarioDto {
    nome: string;
    email: string;
    senha: string;
    conselhoSigla?: string;
    conselhoUf?: string;
    conselhoProf?: string;
    registroProf?: string;
    especialidade?: string;
    role?: UserRole;
}
