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
exports.MetricsController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const create_clinical_flow_event_dto_1 = require("./dto/create-clinical-flow-event.dto");
const create_patient_check_click_dto_1 = require("./dto/create-patient-check-click.dto");
const metrics_service_1 = require("./metrics.service");
let MetricsController = class MetricsController {
    metricsService;
    constructor(metricsService) {
        this.metricsService = metricsService;
    }
    trackClinicalFlowEvent(usuario, dto) {
        return this.metricsService.trackClinicalFlowEvent(usuario.id, dto);
    }
    trackPatientCheckClick(usuario, dto) {
        return this.metricsService.trackPatientCheckClick(usuario.id, dto);
    }
    getClinicalFlowSummary(usuario, windowDays) {
        return this.metricsService.getClinicalFlowSummary(usuario.id, windowDays);
    }
    getPatientCheckEngagementSummary(usuario, windowDays) {
        return this.metricsService.getPatientCheckEngagementSummary(usuario.id, windowDays);
    }
};
exports.MetricsController = MetricsController;
__decorate([
    (0, common_1.Post)(),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 200 } }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario,
        create_clinical_flow_event_dto_1.CreateClinicalFlowEventDto]),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "trackClinicalFlowEvent", null);
__decorate([
    (0, common_1.Post)('check-click'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 300 } }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario,
        create_patient_check_click_dto_1.CreatePatientCheckClickDto]),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "trackPatientCheckClick", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('windowDays', new common_1.DefaultValuePipe(7), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, Number]),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "getClinicalFlowSummary", null);
__decorate([
    (0, common_1.Get)('check-engagement-summary'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('windowDays', new common_1.DefaultValuePipe(7), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, Number]),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "getPatientCheckEngagementSummary", null);
exports.MetricsController = MetricsController = __decorate([
    (0, common_1.Controller)('metrics/clinical-flow'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __metadata("design:paramtypes", [metrics_service_1.MetricsService])
], MetricsController);
//# sourceMappingURL=metrics.controller.js.map