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
exports.PacientesController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const pacientes_service_1 = require("./pacientes.service");
const create_paciente_dto_1 = require("./dto/create-paciente.dto");
const update_paciente_dto_1 = require("./dto/update-paciente.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const usuario_entity_2 = require("../usuarios/entities/usuario.entity");
let PacientesController = class PacientesController {
    pacientesService;
    constructor(pacientesService) {
        this.pacientesService = pacientesService;
    }
    create(createPacienteDto, usuario) {
        return this.pacientesService.create(createPacienteDto, usuario.id);
    }
    findAll(usuario) {
        return this.pacientesService.findAll(usuario.id);
    }
    findPaged(usuario, page, limit) {
        return this.pacientesService.findPaged(usuario.id, page, limit);
    }
    getAttention(usuario) {
        return this.pacientesService.getAttentionMap(usuario.id);
    }
    getStats(usuario) {
        return this.pacientesService.getStats(usuario.id);
    }
    getMyPacienteProfile(usuario) {
        return this.pacientesService.getMyPacienteProfile(usuario);
    }
    findOne(id, usuario) {
        return this.pacientesService.findOne(id, usuario.id);
    }
    update(id, updatePacienteDto, usuario) {
        return this.pacientesService.update(id, updatePacienteDto, usuario.id);
    }
    remove(id, usuario) {
        return this.pacientesService.remove(id, usuario.id);
    }
};
exports.PacientesController = PacientesController;
__decorate([
    (0, common_1.Post)(),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_paciente_dto_1.CreatePacienteDto,
        usuario_entity_2.Usuario]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_2.Usuario]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('paged'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(30), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_2.Usuario, Number, Number]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "findPaged", null);
__decorate([
    (0, common_1.Get)('attention'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_2.Usuario]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "getAttention", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_2.Usuario]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.PACIENTE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_2.Usuario]),
    __metadata("design:returntype", Promise)
], PacientesController.prototype, "getMyPacienteProfile", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_2.Usuario]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_paciente_dto_1.UpdatePacienteDto,
        usuario_entity_2.Usuario]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 20 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_2.Usuario]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "remove", null);
exports.PacientesController = PacientesController = __decorate([
    (0, common_1.Controller)('pacientes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [pacientes_service_1.PacientesService])
], PacientesController);
//# sourceMappingURL=pacientes.controller.js.map