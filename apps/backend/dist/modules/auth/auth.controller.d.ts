import type { Request } from 'express';
import { AuthService, LoginResponse } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { PacienteUsuarioQueryDto } from './dto/paciente-usuario-query.dto';
import { SearchPacienteUsuariosQueryDto } from './dto/search-paciente-usuarios-query.dto';
import { PacienteUsuarioResponseDto } from './dto/paciente-usuario-response.dto';
import { CreatePacienteInviteDto } from './dto/create-paciente-invite.dto';
import { RegistroPacientePorConviteDto } from './dto/registro-paciente-por-convite.dto';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
export declare class AuthController {
    private readonly authService;
    private readonly usuariosService;
    constructor(authService: AuthService, usuariosService: UsuariosService);
    login(loginDto: LoginDto, req: Request): Promise<LoginResponse>;
    refresh(refreshDto: RefreshDto): Promise<LoginResponse>;
    registro(createUsuarioDto: CreateUsuarioDto): Promise<{
        message: string;
        usuario: {
            id: string;
            nome: string;
            email: string;
        };
    }>;
    gerarConvitePaciente(usuario: Usuario, body: CreatePacienteInviteDto): Promise<{
        token: string;
        link: string;
        expiraEmDias: number;
    }>;
    registroPacientePorConvite(dto: RegistroPacientePorConviteDto): Promise<LoginResponse & {
        vinculadoAutomaticamente: boolean;
        pacienteId: string | null;
        profissionalId: string;
    }>;
    me(usuario: Usuario): Promise<{
        id: string;
        nome: string;
        email: string;
        registroProf: string;
        especialidade: string;
        role: UserRole;
    }>;
    getPacienteUsuarioByEmail(query: PacienteUsuarioQueryDto): Promise<PacienteUsuarioResponseDto | null>;
    searchPacienteUsuarios(query: SearchPacienteUsuariosQueryDto): Promise<PacienteUsuarioResponseDto[]>;
}
