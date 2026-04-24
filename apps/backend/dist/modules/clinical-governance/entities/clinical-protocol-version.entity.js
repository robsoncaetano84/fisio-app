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
exports.ClinicalProtocolVersion = void 0;
const typeorm_1 = require("typeorm");
let ClinicalProtocolVersion = class ClinicalProtocolVersion {
    id;
    name;
    version;
    isActive;
    definition;
    activatedAt;
    deactivatedAt;
    activatedBy;
    createdAt;
    updatedAt;
};
exports.ClinicalProtocolVersion = ClinicalProtocolVersion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ClinicalProtocolVersion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 80 }),
    __metadata("design:type", String)
], ClinicalProtocolVersion.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40 }),
    __metadata("design:type", String)
], ClinicalProtocolVersion.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ClinicalProtocolVersion.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'{}'" }),
    __metadata("design:type", Object)
], ClinicalProtocolVersion.prototype, "definition", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activated_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], ClinicalProtocolVersion.prototype, "activatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deactivated_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], ClinicalProtocolVersion.prototype, "deactivatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activated_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], ClinicalProtocolVersion.prototype, "activatedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ClinicalProtocolVersion.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ClinicalProtocolVersion.prototype, "updatedAt", void 0);
exports.ClinicalProtocolVersion = ClinicalProtocolVersion = __decorate([
    (0, typeorm_1.Entity)('clinical_protocol_versions'),
    (0, typeorm_1.Index)('idx_clinical_protocol_versions_active', ['isActive']),
    (0, typeorm_1.Index)('idx_clinical_protocol_versions_created', ['createdAt'])
], ClinicalProtocolVersion);
//# sourceMappingURL=clinical-protocol-version.entity.js.map