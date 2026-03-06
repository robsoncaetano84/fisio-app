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
exports.AnamnesesController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const anamneses_service_1 = require("./anamneses.service");
const create_anamnese_dto_1 = require("./dto/create-anamnese.dto");
const update_anamnese_dto_1 = require("./dto/update-anamnese.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
let AnamnesesController = class AnamnesesController {
    anamnesesService;
    constructor(anamnesesService) {
        this.anamnesesService = anamnesesService;
    }
    create(createAnamneseDto, usuario) {
        return this.anamnesesService.create(createAnamneseDto, usuario.id);
    }
    findAllByPaciente(pacienteId, usuario) {
        return this.anamnesesService.findAllByPaciente(pacienteId, usuario.id);
    }
    findOne(id, usuario) {
        return this.anamnesesService.findOne(id, usuario.id);
    }
    update(id, updateAnamneseDto, usuario) {
        return this.anamnesesService.update(id, updateAnamneseDto, usuario.id);
    }
    remove(id, usuario) {
        return this.anamnesesService.remove(id, usuario.id);
    }
};
exports.AnamnesesController = AnamnesesController;
__decorate([
    (0, common_1.Post)(),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_anamnese_dto_1.CreateAnamneseDto,
        usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], AnamnesesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    __param(0, (0, common_1.Query)('pacienteId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], AnamnesesController.prototype, "findAllByPaciente", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], AnamnesesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_anamnese_dto_1.UpdateAnamneseDto,
        usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], AnamnesesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 20 } }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], AnamnesesController.prototype, "remove", null);
exports.AnamnesesController = AnamnesesController = __decorate([
    (0, common_1.Controller)('anamneses'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [anamneses_service_1.AnamnesesService])
], AnamnesesController);
//# sourceMappingURL=anamneses.controller.js.map