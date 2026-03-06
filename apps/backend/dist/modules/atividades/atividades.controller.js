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
exports.AtividadesController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const create_atividade_dto_1 = require("./dto/create-atividade.dto");
const create_atividade_checkin_dto_1 = require("./dto/create-atividade-checkin.dto");
const duplicate_atividade_dto_1 = require("./dto/duplicate-atividade.dto");
const duplicate_atividades_batch_dto_1 = require("./dto/duplicate-atividades-batch.dto");
const update_atividade_dto_1 = require("./dto/update-atividade.dto");
const atividades_service_1 = require("./atividades.service");
let AtividadesController = class AtividadesController {
    atividadesService;
    constructor(atividadesService) {
        this.atividadesService = atividadesService;
    }
    create(dto, usuario) {
        return this.atividadesService.create(dto, usuario.id);
    }
    findByPaciente(pacienteId, usuario) {
        return this.atividadesService.findByPaciente(pacienteId, usuario.id);
    }
    inativar(atividadeId, usuario) {
        return this.atividadesService.inativar(atividadeId, usuario.id);
    }
    duplicar(atividadeId, dto, usuario) {
        return this.atividadesService.duplicar(atividadeId, usuario.id, dto);
    }
    duplicarLote(dto, usuario) {
        return this.atividadesService.duplicarLote(usuario.id, dto);
    }
    update(atividadeId, dto, usuario) {
        return this.atividadesService.update(atividadeId, dto, usuario.id);
    }
    findMinhas(usuario) {
        return this.atividadesService.findMinhasAtividades(usuario);
    }
    findCheckinsByPaciente(pacienteId, usuario) {
        return this.atividadesService.findCheckinsByPaciente(pacienteId, usuario.id);
    }
    findUpdates(usuario, since, limit) {
        const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
        return this.atividadesService.findUpdatesByProfissional(usuario.id, {
            since,
            limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
        });
    }
    createMeuCheckin(atividadeId, dto, usuario) {
        return this.atividadesService.createMeuCheckin(atividadeId, dto, usuario);
    }
    findCheckinsByAtividade(atividadeId, usuario) {
        return this.atividadesService.findCheckinsByAtividade(atividadeId, usuario.id);
    }
};
exports.AtividadesController = AtividadesController;
__decorate([
    (0, common_1.Post)(),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_atividade_dto_1.CreateAtividadeDto, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], AtividadesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Query)('pacienteId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], AtividadesController.prototype, "findByPaciente", null);
__decorate([
    (0, common_1.Patch)(':id/inativar'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 60 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], AtividadesController.prototype, "inativar", null);
__decorate([
    (0, common_1.Post)(':id/duplicar'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 60 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, duplicate_atividade_dto_1.DuplicateAtividadeDto,
        usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], AtividadesController.prototype, "duplicar", null);
__decorate([
    (0, common_1.Post)('duplicar-lote'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [duplicate_atividades_batch_dto_1.DuplicateAtividadesBatchDto,
        usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], AtividadesController.prototype, "duplicarLote", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 60 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_atividade_dto_1.UpdateAtividadeDto,
        usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], AtividadesController.prototype, "update", null);
__decorate([
    (0, common_1.Get)('minhas'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.PACIENTE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], AtividadesController.prototype, "findMinhas", null);
__decorate([
    (0, common_1.Get)('checkins'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Query)('pacienteId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], AtividadesController.prototype, "findCheckinsByPaciente", null);
__decorate([
    (0, common_1.Get)('updates'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('since')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String, String]),
    __metadata("design:returntype", void 0)
], AtividadesController.prototype, "findUpdates", null);
__decorate([
    (0, common_1.Post)(':id/checkins'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 40 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.PACIENTE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_atividade_checkin_dto_1.CreateAtividadeCheckinDto,
        usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], AtividadesController.prototype, "createMeuCheckin", null);
__decorate([
    (0, common_1.Get)(':id/checkins'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], AtividadesController.prototype, "findCheckinsByAtividade", null);
exports.AtividadesController = AtividadesController = __decorate([
    (0, common_1.Controller)('atividades'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [atividades_service_1.AtividadesService])
], AtividadesController);
//# sourceMappingURL=atividades.controller.js.map