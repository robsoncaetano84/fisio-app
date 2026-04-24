import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AuthLogsService } from './auth-logs.service';
import { LockoutService } from './lockout.service';
import { UserRole } from '../usuarios/entities/usuario.entity';
import { Repository } from 'typeorm';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { ProfissionalPacienteVinculo } from '../pacientes/entities/profissional-paciente-vinculo.entity';
import { RegistroPacientePorConviteDto } from './dto/registro-paciente-por-convite.dto';
import { CreatePacienteConviteRapidoDto } from './dto/create-paciente-convite-rapido.dto';
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
}
export interface LoginResponse {
    token: string;
    refreshToken: string;
    featureFlags: AuthFeatureFlagsResponse;
    usuario: {
        id: string;
        nome: string;
        email: string;
        conselhoSigla: string;
        conselhoUf: string;
        conselhoProf: string;
        registroProf: string;
        especialidade: string;
        consentTermsRequired: boolean;
        consentPrivacyRequired: boolean;
        consentResearchOptional: boolean;
        consentAiOptional: boolean;
        consentAcceptedAt: Date | null;
        consentProfessionalLgpdRequired: boolean;
        role: UserRole;
    };
}
export interface AuthFeatureFlagsResponse {
    speechToText: boolean;
    requireAiSuggestionConfirmation: boolean;
    crmAdminWeb: boolean;
    clinicalOrchestrator: boolean;
    generatedAt: string;
}
export declare class AuthService {
    private readonly usuariosService;
    private readonly jwtService;
    private readonly configService;
    private readonly authLogsService;
    private readonly lockoutService;
    private readonly pacienteRepository;
    private readonly vinculoRepository;
    private readonly logger;
    constructor(usuariosService: UsuariosService, jwtService: JwtService, configService: ConfigService, authLogsService: AuthLogsService, lockoutService: LockoutService, pacienteRepository: Repository<Paciente>, vinculoRepository: Repository<ProfissionalPacienteVinculo>);
    private normalizeLoginIdentifier;
    private parseBoolean;
    private parseFeatureFlagsByEmailConfig;
    getFeatureFlagsForUser(usuario: Usuario): AuthFeatureFlagsResponse;
    validateUser(identificador: string, senha: string): Promise<Usuario | null>;
    private signAccessToken;
    private signRefreshToken;
    private buildLoginResponse;
    login(identificador: string, senha: string, meta?: {
        ip?: string;
    }): Promise<LoginResponse>;
    refresh(refreshToken: string): Promise<LoginResponse>;
    requestPasswordReset(email: string): Promise<{
        message: string;
    }>;
    private getInviteSecret;
    private mapPacienteOrigemToVinculoOrigem;
    private resolveInviteContext;
    obterDadosConvitePaciente(conviteToken: string): Promise<{
        nome: string;
        email: string;
    }>;
    private vincularPacienteUsuarioAoCadastro;
    private sanitizeDigits;
    private shouldReplaceQuickInviteName;
    private syncQuickInvitePacienteDados;
    private generateUniquePacienteCpf;
    gerarConviteRapidoPaciente(profissional: Usuario, dto: CreatePacienteConviteRapidoDto): Promise<{
        pacienteId: string;
        token: string;
        link: string;
        expiraEmDias: number;
    }>;
    gerarConvitePaciente(profissional: Usuario, pacienteId: string, diasExpiracao?: number): Promise<{
        token: string;
        link: string;
        expiraEmDias: number;
    }>;
    aceitarConvitePaciente(pacienteUsuario: Usuario, conviteToken: string): Promise<{
        vinculadoAutomaticamente: boolean;
        pacienteId: string;
        profissionalId: string;
    }>;
    registrarPacientePorConvite(dto: RegistroPacientePorConviteDto): Promise<LoginResponse & {
        vinculadoAutomaticamente: boolean;
        pacienteId: string | null;
        profissionalId: string;
    }>;
}
