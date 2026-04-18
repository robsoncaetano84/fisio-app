import type { Request } from 'express';
import { AuthService, LoginResponse } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { CreatePacienteInviteDto } from './dto/create-paciente-invite.dto';
import { CreatePacienteConviteRapidoDto } from './dto/create-paciente-convite-rapido.dto';
import { RegistroPacientePorConviteDto } from './dto/registro-paciente-por-convite.dto';
import { AceitarPacienteInviteDto } from './dto/aceitar-paciente-convite.dto';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
export declare class AuthController {
    private readonly authService;
    private readonly usuariosService;
    constructor(authService: AuthService, usuariosService: UsuariosService);
    login(loginDto: LoginDto, req: Request): Promise<LoginResponse>;
    refresh(refreshDto: RefreshDto): Promise<LoginResponse>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
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
    gerarConviteRapidoPaciente(usuario: Usuario, body: CreatePacienteConviteRapidoDto): Promise<{
        pacienteId: string;
        token: string;
        link: string;
        expiraEmDias: number;
    }>;
    registroPacientePorConvite(dto: RegistroPacientePorConviteDto): Promise<LoginResponse & {
        vinculadoAutomaticamente: boolean;
        pacienteId: string | null;
        profissionalId: string;
    }>;
    aceitarConvitePaciente(usuario: Usuario, dto: AceitarPacienteInviteDto): Promise<{
        vinculadoAutomaticamente: boolean;
        pacienteId: string;
        profissionalId: string;
    }>;
    me(usuario: Usuario): Promise<{
        id: string;
        nome: string;
        email: string;
        conselhoSigla: string;
        conselhoUf: string;
        conselhoProf: string;
        registroProf: string;
        especialidade: string;
        role: UserRole;
    }>;
    updateMe(usuario: Usuario, dto: UpdateMeDto): Promise<{
        id: string;
        nome: string;
        email: string;
        conselhoSigla: string;
        conselhoUf: string;
        conselhoProf: string;
        registroProf: string;
        especialidade: string;
        role: UserRole;
    }>;
}
