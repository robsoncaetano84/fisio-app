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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const usuarios_service_1 = require("../usuarios/usuarios.service");
const login_dto_1 = require("./dto/login.dto");
const refresh_dto_1 = require("./dto/refresh.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const create_usuario_dto_1 = require("../usuarios/dto/create-usuario.dto");
const update_me_dto_1 = require("./dto/update-me.dto");
const create_paciente_invite_dto_1 = require("./dto/create-paciente-invite.dto");
const create_paciente_convite_rapido_dto_1 = require("./dto/create-paciente-convite-rapido.dto");
const registro_paciente_por_convite_dto_1 = require("./dto/registro-paciente-por-convite.dto");
const aceitar_paciente_convite_dto_1 = require("./dto/aceitar-paciente-convite.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const roles_decorator_1 = require("./decorators/roles.decorator");
let AuthController = class AuthController {
    authService;
    usuariosService;
    constructor(authService, usuariosService) {
        this.authService = authService;
        this.usuariosService = usuariosService;
    }
    async login(loginDto, req) {
        const identificador = (loginDto.identificador || loginDto.email || '').trim();
        if (!identificador) {
            throw new common_1.BadRequestException('E-mail ou CPF é obrigatório');
        }
        return this.authService.login(identificador, loginDto.senha, {
            ip: req.ip,
        });
    }
    async refresh(refreshDto) {
        return this.authService.refresh(refreshDto.refreshToken);
    }
    async forgotPassword(dto) {
        return this.authService.requestPasswordReset(dto.email);
    }
    async registro(createUsuarioDto) {
        const usuario = await this.usuariosService.create(createUsuarioDto);
        return {
            message: 'Usuario criado com sucesso',
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
            },
        };
    }
    async gerarConvitePaciente(usuario, body) {
        return this.authService.gerarConvitePaciente(usuario, body.pacienteId, body?.diasExpiracao);
    }
    async gerarConviteRapidoPaciente(usuario, body) {
        return this.authService.gerarConviteRapidoPaciente(usuario, body);
    }
    async registroPacientePorConvite(dto) {
        return this.authService.registrarPacientePorConvite(dto);
    }
    async aceitarConvitePaciente(usuario, dto) {
        return this.authService.aceitarConvitePaciente(usuario, dto.conviteToken);
    }
    async me(usuario) {
        return {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            conselhoSigla: usuario.conselhoSigla,
            conselhoUf: usuario.conselhoUf,
            conselhoProf: usuario.conselhoProf,
            registroProf: usuario.registroProf,
            especialidade: usuario.especialidade,
            consentTermsRequired: usuario.consentTermsRequired,
            consentPrivacyRequired: usuario.consentPrivacyRequired,
            consentResearchOptional: usuario.consentResearchOptional,
            consentAiOptional: usuario.consentAiOptional,
            consentAcceptedAt: usuario.consentAcceptedAt,
            consentProfessionalLgpdRequired: usuario.consentProfessionalLgpdRequired,
            role: usuario.role,
        };
    }
    async updateMe(usuario, dto) {
        const updated = await this.usuariosService.updateMe(usuario.id, dto);
        return {
            id: updated.id,
            nome: updated.nome,
            email: updated.email,
            conselhoSigla: updated.conselhoSigla,
            conselhoUf: updated.conselhoUf,
            conselhoProf: updated.conselhoProf,
            registroProf: updated.registroProf,
            especialidade: updated.especialidade,
            consentTermsRequired: updated.consentTermsRequired,
            consentPrivacyRequired: updated.consentPrivacyRequired,
            consentResearchOptional: updated.consentResearchOptional,
            consentAiOptional: updated.consentAiOptional,
            consentAcceptedAt: updated.consentAcceptedAt,
            consentProfessionalLgpdRequired: updated.consentProfessionalLgpdRequired,
            role: updated.role,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 5 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 10 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_dto_1.RefreshDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 5 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('registro'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 3 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_usuario_dto_1.CreateUsuarioDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registro", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('paciente-convite'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 20 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario,
        create_paciente_invite_dto_1.CreatePacienteInviteDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "gerarConvitePaciente", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('paciente-convite-rapido'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 20 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario,
        create_paciente_convite_rapido_dto_1.CreatePacienteConviteRapidoDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "gerarConviteRapidoPaciente", null);
__decorate([
    (0, common_1.Post)('registro-paciente-convite'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 10 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [registro_paciente_por_convite_dto_1.RegistroPacientePorConviteDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registroPacientePorConvite", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('aceitar-paciente-convite'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 20 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.PACIENTE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario,
        aceitar_paciente_convite_dto_1.AceitarPacienteInviteDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "aceitarConvitePaciente", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, update_me_dto_1.UpdateMeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateMe", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        usuarios_service_1.UsuariosService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map