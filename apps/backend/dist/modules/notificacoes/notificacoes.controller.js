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
exports.NotificacoesController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const register_push_token_dto_1 = require("./dto/register-push-token.dto");
const remove_push_token_dto_1 = require("./dto/remove-push-token.dto");
const notificacoes_service_1 = require("./notificacoes.service");
let NotificacoesController = class NotificacoesController {
    notificacoesService;
    constructor(notificacoesService) {
        this.notificacoesService = notificacoesService;
    }
    async registerPushToken(dto, usuario) {
        const token = await this.notificacoesService.registerToken(usuario.id, dto);
        return {
            id: token.id,
            ativo: token.ativo,
            plataforma: token.plataforma,
            updatedAt: token.updatedAt,
        };
    }
    async removePushToken(dto, usuario) {
        await this.notificacoesService.removeToken(usuario.id, dto.expoPushToken);
        return { success: true };
    }
};
exports.NotificacoesController = NotificacoesController;
__decorate([
    (0, common_1.Post)('token'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER, usuario_entity_1.UserRole.PACIENTE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_push_token_dto_1.RegisterPushTokenDto,
        usuario_entity_1.Usuario]),
    __metadata("design:returntype", Promise)
], NotificacoesController.prototype, "registerPushToken", null);
__decorate([
    (0, common_1.Delete)('token'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER, usuario_entity_1.UserRole.PACIENTE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [remove_push_token_dto_1.RemovePushTokenDto,
        usuario_entity_1.Usuario]),
    __metadata("design:returntype", Promise)
], NotificacoesController.prototype, "removePushToken", null);
exports.NotificacoesController = NotificacoesController = __decorate([
    (0, common_1.Controller)('notificacoes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [notificacoes_service_1.NotificacoesService])
], NotificacoesController);
//# sourceMappingURL=notificacoes.controller.js.map