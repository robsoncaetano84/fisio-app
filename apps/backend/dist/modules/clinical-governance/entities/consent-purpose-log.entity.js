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
exports.ConsentPurposeLog = void 0;
const typeorm_1 = require("typeorm");
let ConsentPurposeLog = class ConsentPurposeLog {
    id;
    userId;
    purpose;
    accepted;
    acceptedAt;
    protocolVersion;
    source;
    changedBy;
    createdAt;
};
exports.ConsentPurposeLog = ConsentPurposeLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ConsentPurposeLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], ConsentPurposeLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 60 }),
    __metadata("design:type", String)
], ConsentPurposeLog.prototype, "purpose", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'accepted', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ConsentPurposeLog.prototype, "accepted", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'accepted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], ConsentPurposeLog.prototype, "acceptedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'protocol_version', type: 'varchar', length: 40, nullable: true }),
    __metadata("design:type", Object)
], ConsentPurposeLog.prototype, "protocolVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, default: 'APP' }),
    __metadata("design:type", String)
], ConsentPurposeLog.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'changed_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], ConsentPurposeLog.prototype, "changedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ConsentPurposeLog.prototype, "createdAt", void 0);
exports.ConsentPurposeLog = ConsentPurposeLog = __decorate([
    (0, typeorm_1.Entity)('consent_purpose_logs'),
    (0, typeorm_1.Index)('idx_consent_purpose_logs_user_created', ['userId', 'createdAt']),
    (0, typeorm_1.Index)('idx_consent_purpose_logs_purpose_created', ['purpose', 'createdAt'])
], ConsentPurposeLog);
//# sourceMappingURL=consent-purpose-log.entity.js.map