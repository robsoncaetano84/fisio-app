"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalGovernanceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const clinical_governance_controller_1 = require("./clinical-governance.controller");
const clinical_governance_service_1 = require("./clinical-governance.service");
const clinical_audit_log_entity_1 = require("./entities/clinical-audit-log.entity");
const clinical_protocol_version_entity_1 = require("./entities/clinical-protocol-version.entity");
const consent_purpose_log_entity_1 = require("./entities/consent-purpose-log.entity");
let ClinicalGovernanceModule = class ClinicalGovernanceModule {
};
exports.ClinicalGovernanceModule = ClinicalGovernanceModule;
exports.ClinicalGovernanceModule = ClinicalGovernanceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                clinical_protocol_version_entity_1.ClinicalProtocolVersion,
                consent_purpose_log_entity_1.ConsentPurposeLog,
                clinical_audit_log_entity_1.ClinicalAuditLog,
                usuario_entity_1.Usuario,
            ]),
        ],
        controllers: [clinical_governance_controller_1.ClinicalGovernanceController],
        providers: [clinical_governance_service_1.ClinicalGovernanceService],
        exports: [clinical_governance_service_1.ClinicalGovernanceService],
    })
], ClinicalGovernanceModule);
//# sourceMappingURL=clinical-governance.module.js.map