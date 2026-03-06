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
exports.LaudosController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const config_1 = require("@nestjs/config");
const jsonwebtoken_1 = require("jsonwebtoken");
const laudos_service_1 = require("./laudos.service");
const create_laudo_dto_1 = require("./dto/create-laudo.dto");
const update_laudo_dto_1 = require("./dto/update-laudo.dto");
const generate_laudo_dto_1 = require("./dto/generate-laudo.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const usuario_entity_2 = require("../usuarios/entities/usuario.entity");
let LaudosController = class LaudosController {
    laudosService;
    configService;
    constructor(laudosService, configService) {
        this.laudosService = laudosService;
        this.configService = configService;
    }
    resolveUsuarioIdFromAccessToken(token) {
        if (!token) {
            throw new common_1.UnauthorizedException('Token nao informado');
        }
        const secret = this.configService.get('JWT_SECRET') || 'default-secret';
        try {
            const payload = (0, jsonwebtoken_1.verify)(token, secret);
            if (!payload?.sub) {
                throw new common_1.UnauthorizedException('Token invalido');
            }
            return payload.sub;
        }
        catch {
            throw new common_1.UnauthorizedException('Token invalido');
        }
    }
    resolveUsuarioIdFromRequest(req, token) {
        const authHeader = String(req.headers.authorization || '');
        const bearerToken = authHeader.replace(/^Bearer\s+/i, '');
        return this.resolveUsuarioIdFromAccessToken(token || bearerToken || undefined);
    }
    create(createLaudoDto, usuario) {
        return this.laudosService.create(createLaudoDto, usuario.id);
    }
    findByPaciente(pacienteId, autoGenerate, usuario) {
        return this.laudosService.findByPaciente(pacienteId, usuario.id, autoGenerate === 'true');
    }
    generateByPaciente(generateLaudoDto, usuario) {
        return this.laudosService.generateAndSaveByPaciente(generateLaudoDto.pacienteId, usuario.id);
    }
    getSuggestedReferences(pacienteId, usuario) {
        return this.laudosService.getSuggestedReferences(pacienteId, usuario.id);
    }
    findOne(id, usuario) {
        return this.laudosService.findOne(id, usuario.id);
    }
    async pdfLaudo(id, req, token, consultedRefs, res) {
        const usuarioId = this.resolveUsuarioIdFromRequest(req, token);
        const pdf = await this.laudosService.buildPdfBuffer(id, usuarioId, 'laudo', {
            consultedReferenceIds: (consultedRefs || '')
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean),
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="laudo-${id}.pdf"`);
        res.send(pdf);
    }
    findMyLatest(usuario) {
        return this.laudosService.findLatestByPacienteUsuario(usuario.id);
    }
    async myPdfLaudo(req, token, res) {
        const usuarioId = this.resolveUsuarioIdFromRequest(req, token);
        const pdf = await this.laudosService.buildPdfBufferByPacienteUsuario(usuarioId, 'laudo');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="meu-laudo.pdf"');
        res.send(pdf);
    }
    async myPdfPlano(req, token, res) {
        const usuarioId = this.resolveUsuarioIdFromRequest(req, token);
        const pdf = await this.laudosService.buildPdfBufferByPacienteUsuario(usuarioId, 'plano');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="meu-plano-tratamento.pdf"');
        res.send(pdf);
    }
    async pdfPlano(id, req, token, consultedRefs, res) {
        const usuarioId = this.resolveUsuarioIdFromRequest(req, token);
        const pdf = await this.laudosService.buildPdfBuffer(id, usuarioId, 'plano', {
            consultedReferenceIds: (consultedRefs || '')
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean),
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="plano-tratamento-${id}.pdf"`);
        res.send(pdf);
    }
    update(id, updateLaudoDto, usuario) {
        return this.laudosService.update(id, updateLaudoDto, usuario.id);
    }
    validar(id, usuario) {
        return this.laudosService.validarLaudo(id, usuario.id);
    }
    remove(id, usuario) {
        return this.laudosService.remove(id, usuario.id);
    }
};
exports.LaudosController = LaudosController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_laudo_dto_1.CreateLaudoDto, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    __param(0, (0, common_1.Query)('pacienteId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('autoGenerate')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "findByPaciente", null);
__decorate([
    (0, common_1.Post)('gerar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 20 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_laudo_dto_1.GenerateLaudoDto,
        usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "generateByPaciente", null);
__decorate([
    (0, common_1.Get)('referencias-sugeridas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 60 } }),
    __param(0, (0, common_1.Query)('pacienteId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "getSuggestedReferences", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/pdf-laudo'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('token')),
    __param(3, (0, common_1.Query)('consultedRefs')),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], LaudosController.prototype, "pdfLaudo", null);
__decorate([
    (0, common_1.Get)('self'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_2.UserRole.PACIENTE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "findMyLatest", null);
__decorate([
    (0, common_1.Get)('self/pdf-laudo'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('token')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], LaudosController.prototype, "myPdfLaudo", null);
__decorate([
    (0, common_1.Get)('self/pdf-plano'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('token')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], LaudosController.prototype, "myPdfPlano", null);
__decorate([
    (0, common_1.Get)(':id/pdf-plano'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('token')),
    __param(3, (0, common_1.Query)('consultedRefs')),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], LaudosController.prototype, "pdfPlano", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_laudo_dto_1.UpdateLaudoDto,
        usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/validar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 20 } }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "validar", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 20 } }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "remove", null);
exports.LaudosController = LaudosController = __decorate([
    (0, common_1.Controller)('laudos'),
    __metadata("design:paramtypes", [laudos_service_1.LaudosService,
        config_1.ConfigService])
], LaudosController);
//# sourceMappingURL=laudos.controller.js.map