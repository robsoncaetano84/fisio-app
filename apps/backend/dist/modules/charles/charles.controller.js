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
exports.CharlesController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const charles_service_1 = require("./charles.service");
const get_charles_next_action_dto_1 = require("./dto/get-charles-next-action.dto");
let CharlesController = class CharlesController {
    charlesService;
    constructor(charlesService) {
        this.charlesService = charlesService;
    }
    getNextAction(usuario, params) {
        return this.charlesService.getNextAction(params.pacienteId, usuario);
    }
    getExameFisicoDorSuggestion(usuario, params) {
        return this.charlesService.getExameFisicoDorSuggestion(params.pacienteId, usuario);
    }
    getEvolucaoSoapSuggestion(usuario, params) {
        return this.charlesService.getEvolucaoSoapSuggestion(params.pacienteId, usuario);
    }
};
exports.CharlesController = CharlesController;
__decorate([
    (0, common_1.Get)('patients/:pacienteId/next-action'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario,
        get_charles_next_action_dto_1.GetCharlesNextActionDto]),
    __metadata("design:returntype", Promise)
], CharlesController.prototype, "getNextAction", null);
__decorate([
    (0, common_1.Get)('patients/:pacienteId/suggestions/exame-fisico/dor-classification'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario,
        get_charles_next_action_dto_1.GetCharlesNextActionDto]),
    __metadata("design:returntype", Promise)
], CharlesController.prototype, "getExameFisicoDorSuggestion", null);
__decorate([
    (0, common_1.Get)('patients/:pacienteId/suggestions/evolucao/soap'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario,
        get_charles_next_action_dto_1.GetCharlesNextActionDto]),
    __metadata("design:returntype", Promise)
], CharlesController.prototype, "getEvolucaoSoapSuggestion", null);
exports.CharlesController = CharlesController = __decorate([
    (0, common_1.Controller)(['clinical-orchestrator', 'charles']),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __metadata("design:paramtypes", [charles_service_1.CharlesService])
], CharlesController);
//# sourceMappingURL=charles.controller.js.map