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
exports.CrmAdminAuditLog = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
let CrmAdminAuditLog = class CrmAdminAuditLog extends base_entity_1.BaseEntity {
    actorId;
    actorEmail;
    action;
    includeSensitive;
    sensitiveReason;
    metadata;
};
exports.CrmAdminAuditLog = CrmAdminAuditLog;
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_id', type: 'uuid' }),
    __metadata("design:type", String)
], CrmAdminAuditLog.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_email', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], CrmAdminAuditLog.prototype, "actorEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'action', type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], CrmAdminAuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'include_sensitive', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], CrmAdminAuditLog.prototype, "includeSensitive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sensitive_reason', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], CrmAdminAuditLog.prototype, "sensitiveReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metadata', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], CrmAdminAuditLog.prototype, "metadata", void 0);
exports.CrmAdminAuditLog = CrmAdminAuditLog = __decorate([
    (0, typeorm_1.Entity)('crm_admin_audit_logs'),
    (0, typeorm_1.Index)('idx_crm_admin_audit_logs_actor_created', ['actorId', 'createdAt']),
    (0, typeorm_1.Index)('idx_crm_admin_audit_logs_action_created', ['action', 'createdAt'])
], CrmAdminAuditLog);
//# sourceMappingURL=crm-admin-audit-log.entity.js.map