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
const laudos_service_1 = require("./laudos.service");
const create_laudo_dto_1 = require("./dto/create-laudo.dto");
const update_laudo_dto_1 = require("./dto/update-laudo.dto");
const create_exame_fisico_dto_1 = require("./dto/create-exame-fisico.dto");
const generate_laudo_dto_1 = require("./dto/generate-laudo.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const usuario_entity_2 = require("../usuarios/entities/usuario.entity");
let LaudosController = class LaudosController {
    laudosService;
    constructor(laudosService) {
        this.laudosService = laudosService;
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
    suggestByPaciente(generateLaudoDto, usuario) {
        return this.laudosService.generateSuggestionPreview(generateLaudoDto.pacienteId, usuario.id);
    }
    getSuggestedReferences(pacienteId, usuario) {
        return this.laudosService.getSuggestedReferences(pacienteId, usuario.id);
    }
    findExameFisicoByPaciente(pacienteId, usuario) {
        return this.laudosService.findExameFisicoByPaciente(pacienteId, usuario.id);
    }
    createExameFisico(createExameFisicoDto, usuario) {
        return this.laudosService.createExameFisico(createExameFisicoDto, usuario.id);
    }
    async myPdfLaudo(usuario, res) {
        const pdf = await this.laudosService.buildPdfBufferByPacienteUsuario(usuario.id, 'laudo');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="meu-laudo.pdf"');
        res.send(pdf);
    }
    async myPdfPlano(usuario, res) {
        const pdf = await this.laudosService.buildPdfBufferByPacienteUsuario(usuario.id, 'plano');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="meu-plano-tratamento.pdf"');
        res.send(pdf);
    }
    findMyLatest(usuario) {
        return this.laudosService.findLatestByPacienteUsuario(usuario.id);
    }
    findOne(id, usuario) {
        return this.laudosService.findOne(id, usuario.id);
    }
    findExameFisicoHistory(id, limitRaw, usuario) {
        const limit = Number(limitRaw || 20);
        return this.laudosService.findExameFisicoHistory(id, usuario.id, limit);
    }
    async pdfLaudo(id, consultedRefs, usuario, res) {
        const pdf = await this.laudosService.buildPdfBuffer(id, usuario.id, 'laudo', {
            consultedReferenceIds: (consultedRefs || '')
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean),
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="laudo-${id}.pdf"`);
        res.send(pdf);
    }
    async pdfPlano(id, consultedRefs, usuario, res) {
        const pdf = await this.laudosService.buildPdfBuffer(id, usuario.id, 'plano', {
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
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_laudo_dto_1.CreateLaudoDto,
        usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
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
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 20 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_laudo_dto_1.GenerateLaudoDto,
        usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "generateByPaciente", null);
__decorate([
    (0, common_1.Post)('sugestao-ia'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_laudo_dto_1.GenerateLaudoDto,
        usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "suggestByPaciente", null);
__decorate([
    (0, common_1.Get)('referencias-sugeridas'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 60 } }),
    __param(0, (0, common_1.Query)('pacienteId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "getSuggestedReferences", null);
__decorate([
    (0, common_1.Get)('exame-fisico'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    __param(0, (0, common_1.Query)('pacienteId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "findExameFisicoByPaciente", null);
__decorate([
    (0, common_1.Post)('exame-fisico'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 20 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_exame_fisico_dto_1.CreateExameFisicoDto,
        usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "createExameFisico", null);
__decorate([
    (0, common_1.Get)('self/pdf-laudo'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_2.UserRole.PACIENTE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, Object]),
    __metadata("design:returntype", Promise)
], LaudosController.prototype, "myPdfLaudo", null);
__decorate([
    (0, common_1.Get)('self/pdf-plano'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_2.UserRole.PACIENTE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, Object]),
    __metadata("design:returntype", Promise)
], LaudosController.prototype, "myPdfPlano", null);
__decorate([
    (0, common_1.Get)('self'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_2.UserRole.PACIENTE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "findMyLatest", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/exame-fisico-historico'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "findExameFisicoHistory", null);
__decorate([
    (0, common_1.Get)(':id/pdf-laudo'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('consultedRefs')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, usuario_entity_1.Usuario, Object]),
    __metadata("design:returntype", Promise)
], LaudosController.prototype, "pdfLaudo", null);
__decorate([
    (0, common_1.Get)(':id/pdf-plano'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('consultedRefs')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, usuario_entity_1.Usuario, Object]),
    __metadata("design:returntype", Promise)
], LaudosController.prototype, "pdfPlano", null);
__decorate([
    (0, common_1.Patch)(':id'),
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
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 20 } }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "validar", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 20 } }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "remove", null);
exports.LaudosController = LaudosController = __decorate([
    (0, common_1.Controller)('laudos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(usuario_entity_2.UserRole.ADMIN, usuario_entity_2.UserRole.USER),
    __metadata("design:paramtypes", [laudos_service_1.LaudosService])
], LaudosController);
//# sourceMappingURL=laudos.controller.js.map