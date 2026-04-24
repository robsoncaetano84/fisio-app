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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalAuditLog = void 0;
const typeorm_1 = require("typeorm");
let ClinicalAuditLog = class ClinicalAuditLog {
    id;
    actorId;
    actorRole;
    patientId;
    actionType;
    action;
    resourceType;
    resourceId;
    metadata;
    createdAt;
};
exports.ClinicalAuditLog = ClinicalAuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ClinicalAuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], ClinicalAuditLog.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_role', type: 'varchar', length: 40, nullable: true }),
    __metadata("design:type", Object)
], ClinicalAuditLog.prototype, "actorRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'patient_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], ClinicalAuditLog.prototype, "patientId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'action_type', type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], ClinicalAuditLog.prototype, "actionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 80 }),
    __metadata("design:type", String)
], ClinicalAuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resource_type', type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", Object)
], ClinicalAuditLog.prototype, "resourceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resource_id', type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", Object)
], ClinicalAuditLog.prototype, "resourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'{}'" }),
    __metadata("design:type", Object)
], ClinicalAuditLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ClinicalAuditLog.prototype, "createdAt", void 0);
exports.ClinicalAuditLog = ClinicalAuditLog = __decorate([
    (0, typeorm_1.Entity)('clinical_audit_logs'),
    (0, typeorm_1.Index)('idx_clinical_audit_logs_actor_created', ['actorId', 'createdAt']),
    (0, typeorm_1.Index)('idx_clinical_audit_logs_action_created', ['actionType', 'createdAt']),
    (0, typeorm_1.Index)('idx_clinical_audit_logs_patient_created', ['patientId', 'createdAt'])
], ClinicalAuditLog);
//# sourceMappingURL=clinical-audit-log.entity.js.map