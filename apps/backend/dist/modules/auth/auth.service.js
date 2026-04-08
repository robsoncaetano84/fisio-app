"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const usuarios_service_1 = require("../usuarios/usuarios.service");
const auth_logs_service_1 = require("./auth-logs.service");
const auth_log_entity_1 = require("./entities/auth-log.entity");
const lockout_service_1 = require("./lockout.service");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const paciente_entity_1 = require("../pacientes/entities/paciente.entity");
let AuthService = AuthService_1 = class AuthService {
    usuariosService;
    jwtService;
    configService;
    authLogsService;
    lockoutService;
    pacienteRepository;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(usuariosService, jwtService, configService, authLogsService, lockoutService, pacienteRepository) {
        this.usuariosService = usuariosService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.authLogsService = authLogsService;
        this.lockoutService = lockoutService;
        this.pacienteRepository = pacienteRepository;
    }
    async validateUser(email, senha) {
        const usuario = await this.usuariosService.findByEmail(email);
        if (!usuario || !usuario.ativo) {
            return null;
        }
        const isPasswordValid = await this.usuariosService.validatePassword(senha, usuario.senha);
        if (!isPasswordValid) {
            return null;
        }
        return usuario;
    }
    signAccessToken(payload) {
        const secret = this.configService.get('JWT_SECRET');
        const expiresIn = this.configService.get('JWT_EXPIRES_IN');
        return this.jwtService.sign(payload, {
            secret,
            expiresIn: expiresIn,
        });
    }
    signRefreshToken(payload) {
        const secret = this.configService.get('REFRESH_SECRET');
        const expiresIn = this.configService.get('REFRESH_EXPIRES_IN');
        return this.jwtService.sign(payload, {
            secret,
            expiresIn: expiresIn,
        });
    }
    buildLoginResponse(usuario) {
        const payload = {
            sub: usuario.id,
            email: usuario.email,
            role: usuario.role,
        };
        return {
            token: this.signAccessToken(payload),
            refreshToken: this.signRefreshToken(payload),
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                registroProf: usuario.registroProf,
                especialidade: usuario.especialidade,
                role: usuario.role,
            },
        };
    }
    async login(email, senha, meta) {
        const isLocked = await this.lockoutService.isLocked(email);
        if (isLocked) {
            this.logger.warn(`Login bloqueado para ${email} (ip=${meta?.ip ?? 'unknown'})`);
            this.logger.log(JSON.stringify({
                event: 'login',
                email,
                ip: meta?.ip ?? null,
                success: false,
                reason: 'LOCKED',
            }));
            await this.authLogsService.record({
                email,
                eventType: auth_log_entity_1.AuthEventType.LOGIN,
                success: false,
                ip: meta?.ip,
                reason: 'LOCKED',
            });
            throw new common_1.UnauthorizedException('Conta temporariamente bloqueada');
        }
        const usuario = await this.validateUser(email, senha);
        if (!usuario) {
            await this.lockoutService.registerFailure(email);
            this.logger.warn(`Login falhou para ${email} (ip=${meta?.ip ?? 'unknown'})`);
            this.logger.log(JSON.stringify({
                event: 'login',
                email,
                ip: meta?.ip ?? null,
                success: false,
                reason: 'INVALID_CREDENTIALS',
            }));
            await this.authLogsService.record({
                email,
                eventType: auth_log_entity_1.AuthEventType.LOGIN,
                success: false,
                ip: meta?.ip,
                reason: 'INVALID_CREDENTIALS',
            });
            throw new common_1.UnauthorizedException('Credenciais invalidas');
        }
        await this.lockoutService.reset(email);
        this.logger.log(`Login ok para ${email} (ip=${meta?.ip ?? 'unknown'})`);
        this.logger.log(JSON.stringify({
            event: 'login',
            email,
            ip: meta?.ip ?? null,
            success: true,
        }));
        await this.authLogsService.record({
            email,
            usuarioId: usuario.id,
            eventType: auth_log_entity_1.AuthEventType.LOGIN,
            success: true,
            ip: meta?.ip,
        });
        return this.buildLoginResponse(usuario);
    }
    async refresh(refreshToken) {
        try {
            const secret = this.configService.get('REFRESH_SECRET');
            const payload = this.jwtService.verify(refreshToken, {
                secret,
            });
            const usuario = await this.usuariosService.findById(payload.sub);
            if (!usuario || !usuario.ativo) {
                throw new common_1.UnauthorizedException('Usuário inválido');
            }
            this.logger.log(`Refresh token ok para ${usuario.email}`);
            this.logger.log(JSON.stringify({
                event: 'refresh',
                email: usuario.email,
                success: true,
            }));
            await this.authLogsService.record({
                email: usuario.email,
                usuarioId: usuario.id,
                eventType: auth_log_entity_1.AuthEventType.REFRESH,
                success: true,
            });
            return this.buildLoginResponse(usuario);
        }
        catch (error) {
            this.logger.warn('Refresh token invalido');
            this.logger.log(JSON.stringify({
                event: 'refresh',
                email: 'unknown',
                success: false,
                reason: 'INVALID_REFRESH',
            }));
            await this.authLogsService.record({
                email: 'unknown',
                eventType: auth_log_entity_1.AuthEventType.REFRESH,
                success: false,
                reason: 'INVALID_REFRESH',
            });
            throw new common_1.UnauthorizedException('Refresh token inválido');
        }
    }
    getInviteSecret() {
        return (this.configService.get('INVITE_SECRET') ||
            this.configService.get('JWT_SECRET') ||
            'invite-default-secret');
    }
    async resolveInviteContext(conviteToken) {
        let payload;
        try {
            payload = this.jwtService.verify(conviteToken, {
                secret: this.getInviteSecret(),
            });
        }
        catch {
            throw new common_1.BadRequestException('Convite invalido ou expirado');
        }
        if (!payload?.sub || !payload?.pacienteId || payload.type !== 'PACIENTE_INVITE') {
            throw new common_1.BadRequestException('Convite invalido');
        }
        const profissional = await this.usuariosService.findById(payload.sub);
        if (!profissional.ativo ||
            (profissional.role !== usuario_entity_1.UserRole.ADMIN &&
                profissional.role !== usuario_entity_1.UserRole.USER)) {
            throw new common_1.BadRequestException('Profissional do convite nao encontrado');
        }
        const pacienteParaVinculo = await this.pacienteRepository.findOne({
            where: {
                id: payload.pacienteId,
                usuarioId: profissional.id,
                ativo: true,
            },
        });
        if (!pacienteParaVinculo) {
            throw new common_1.BadRequestException('Paciente do convite nao encontrado');
        }
        return { profissional, pacienteParaVinculo };
    }
    async vincularPacienteUsuarioAoCadastro(pacienteParaVinculo, pacienteUsuario) {
        if (pacienteParaVinculo.pacienteUsuarioId) {
            if (pacienteParaVinculo.pacienteUsuarioId === pacienteUsuario.id) {
                return;
            }
            throw new common_1.BadRequestException('Paciente ja possui usuario vinculado');
        }
        const vinculoExistente = await this.pacienteRepository.findOne({
            where: { pacienteUsuarioId: pacienteUsuario.id },
        });
        if (vinculoExistente && vinculoExistente.id !== pacienteParaVinculo.id) {
            throw new common_1.BadRequestException('Usuario paciente ja vinculado a outro cadastro');
        }
        pacienteParaVinculo.pacienteUsuarioId = pacienteUsuario.id;
        await this.pacienteRepository.save(pacienteParaVinculo);
    }
    async gerarConvitePaciente(profissional, pacienteId, diasExpiracao) {
        if (profissional.role !== usuario_entity_1.UserRole.ADMIN &&
            profissional.role !== usuario_entity_1.UserRole.USER) {
            throw new common_1.ForbiddenException('Apenas profissionais podem gerar convite');
        }
        const paciente = await this.pacienteRepository.findOne({
            where: { id: pacienteId, usuarioId: profissional.id, ativo: true },
        });
        if (!paciente) {
            throw new common_1.BadRequestException('Paciente do convite nao encontrado');
        }
        if (paciente.pacienteUsuarioId) {
            throw new common_1.BadRequestException('Paciente ja possui usuario vinculado');
        }
        const expiraEmDias = Math.min(Math.max(diasExpiracao ?? 7, 1), 30);
        const inviteBaseUrl = this.configService.get('PATIENT_INVITE_BASE_URL') ||
            'synap://cadastro-paciente';
        const token = this.jwtService.sign({
            sub: profissional.id,
            pacienteId: paciente.id,
            type: 'PACIENTE_INVITE',
        }, {
            secret: this.getInviteSecret(),
            expiresIn: `${expiraEmDias}d`,
        });
        const sep = inviteBaseUrl.includes('?') ? '&' : '?';
        const link = `${inviteBaseUrl}${sep}convite=${encodeURIComponent(token)}`;
        return { token, link, expiraEmDias };
    }
    async aceitarConvitePaciente(pacienteUsuario, conviteToken) {
        if (pacienteUsuario.role !== usuario_entity_1.UserRole.PACIENTE || !pacienteUsuario.ativo) {
            throw new common_1.ForbiddenException('Apenas pacientes autenticados podem aceitar o convite');
        }
        const { profissional, pacienteParaVinculo } = await this.resolveInviteContext(conviteToken);
        await this.vincularPacienteUsuarioAoCadastro(pacienteParaVinculo, pacienteUsuario);
        return {
            vinculadoAutomaticamente: true,
            pacienteId: pacienteParaVinculo.id,
            profissionalId: profissional.id,
        };
    }
    async registrarPacientePorConvite(dto) {
        const { profissional, pacienteParaVinculo } = await this.resolveInviteContext(dto.conviteToken);
        const createUsuarioDto = {
            nome: dto.nome.trim(),
            email: dto.email.trim().toLowerCase(),
            senha: dto.senha,
            role: usuario_entity_1.UserRole.PACIENTE,
        };
        const pacienteUsuario = await this.usuariosService.create(createUsuarioDto);
        await this.vincularPacienteUsuarioAoCadastro(pacienteParaVinculo, pacienteUsuario);
        const pacienteId = pacienteParaVinculo.id;
        const loginResponse = this.buildLoginResponse(pacienteUsuario);
        return {
            ...loginResponse,
            vinculadoAutomaticamente: true,
            pacienteId,
            profissionalId: profissional.id,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, typeorm_1.InjectRepository)(paciente_entity_1.Paciente)),
    __metadata("design:paramtypes", [usuarios_service_1.UsuariosService,
        jwt_1.JwtService,
        config_1.ConfigService,
        auth_logs_service_1.AuthLogsService,
        lockout_service_1.LockoutService,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map