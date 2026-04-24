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
exports.ClinicalGovernanceController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const activate_protocol_dto_1 = require("./dto/activate-protocol.dto");
const log_ai_suggestion_dto_1 = require("./dto/log-ai-suggestion.dto");
const upsert_consent_dto_1 = require("./dto/upsert-consent.dto");
const clinical_governance_service_1 = require("./clinical-governance.service");
let ClinicalGovernanceController = class ClinicalGovernanceController {
    governanceService;
    constructor(governanceService) {
        this.governanceService = governanceService;
    }
    getActiveProtocol(usuario) {
        return this.governanceService.getActiveProtocol(usuario);
    }
    getProtocolHistory(usuario, limit) {
        return this.governanceService.getProtocolHistory(usuario, limit);
    }
    activateProtocol(usuario, dto) {
        return this.governanceService.activateProtocol(dto, usuario);
    }
    getMyConsents(usuario) {
        return this.governanceService.getMyConsents(usuario);
    }
    upsertMyConsent(usuario, dto) {
        return this.governanceService.upsertMyConsent(usuario, dto);
    }
    logAiSuggestion(usuario, dto) {
        return this.governanceService.logAiSuggestion(usuario, dto);
    }
    listAuditLogs(usuario, actionType, patientId, limit) {
        return this.governanceService.listAuditLogs(usuario, {
            actionType,
            patientId,
            limit,
        });
    }
    getAiSuggestionSummary(usuario, windowDays, professionalId, patientId) {
        return this.governanceService.getAiSuggestionSummary(usuario, {
            windowDays,
            professionalId,
            patientId,
        });
    }
};
exports.ClinicalGovernanceController = ClinicalGovernanceController;
__decorate([
    (0, common_1.Get)('protocol/active'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], ClinicalGovernanceController.prototype, "getActiveProtocol", null);
__decorate([
    (0, common_1.Get)('protocol/history'),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, Number]),
    __metadata("design:returntype", void 0)
], ClinicalGovernanceController.prototype, "getProtocolHistory", null);
__decorate([
    (0, common_1.Post)('protocol/activate'),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario,
        activate_protocol_dto_1.ActivateProtocolDto]),
    __metadata("design:returntype", void 0)
], ClinicalGovernanceController.prototype, "activateProtocol", null);
__decorate([
    (0, common_1.Get)('consent/my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario]),
    __metadata("design:returntype", void 0)
], ClinicalGovernanceController.prototype, "getMyConsents", null);
__decorate([
    (0, common_1.Post)('consent/my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, upsert_consent_dto_1.UpsertConsentDto]),
    __metadata("design:returntype", void 0)
], ClinicalGovernanceController.prototype, "upsertMyConsent", null);
__decorate([
    (0, common_1.Post)('ai-suggestions/log'),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, log_ai_suggestion_dto_1.LogAiSuggestionDto]),
    __metadata("design:returntype", void 0)
], ClinicalGovernanceController.prototype, "logAiSuggestion", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('actionType')),
    __param(2, (0, common_1.Query)('patientId')),
    __param(3, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String, String, Number]),
    __metadata("design:returntype", void 0)
], ClinicalGovernanceController.prototype, "listAuditLogs", null);
__decorate([
    (0, common_1.Get)('ai-suggestions/summary'),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('windowDays', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('professionalId')),
    __param(3, (0, common_1.Query)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, Number, String, String]),
    __metadata("design:returntype", void 0)
], ClinicalGovernanceController.prototype, "getAiSuggestionSummary", null);
exports.ClinicalGovernanceController = ClinicalGovernanceController = __decorate([
    (0, common_1.Controller)('clinical-governance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER, usuario_entity_1.UserRole.PACIENTE),
    __metadata("design:paramtypes", [clinical_governance_service_1.ClinicalGovernanceService])
], ClinicalGovernanceController);
//# sourceMappingURL=clinical-governance.controller.js.map