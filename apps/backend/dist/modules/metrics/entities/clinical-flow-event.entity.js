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
exports.ClinicalFlowEvent = void 0;
const typeorm_1 = require("typeorm");
let ClinicalFlowEvent = class ClinicalFlowEvent {
    id;
    professionalId;
    patientId;
    stage;
    eventType;
    durationMs;
    blockedReason;
    occurredAt;
    createdAt;
};
exports.ClinicalFlowEvent = ClinicalFlowEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ClinicalFlowEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'professional_id', type: 'uuid' }),
    __metadata("design:type", String)
], ClinicalFlowEvent.prototype, "professionalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'patient_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], ClinicalFlowEvent.prototype, "patientId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stage', type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ClinicalFlowEvent.prototype, "stage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_type', type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ClinicalFlowEvent.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duration_ms', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], ClinicalFlowEvent.prototype, "durationMs", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'blocked_reason', type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", Object)
], ClinicalFlowEvent.prototype, "blockedReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'occurred_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], ClinicalFlowEvent.prototype, "occurredAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], ClinicalFlowEvent.prototype, "createdAt", void 0);
exports.ClinicalFlowEvent = ClinicalFlowEvent = __decorate([
    (0, typeorm_1.Entity)('clinical_flow_events'),
    (0, typeorm_1.Index)('idx_clinical_flow_events_prof_occurred_at', ['professionalId', 'occurredAt']),
    (0, typeorm_1.Index)('idx_clinical_flow_events_prof_patient_occurred_at', [
        'professionalId',
        'patientId',
        'occurredAt',
    ]),
    (0, typeorm_1.Index)('idx_clinical_flow_events_prof_stage_occurred_at', [
        'professionalId',
        'stage',
        'occurredAt',
    ]),
    (0, typeorm_1.Index)('idx_clinical_flow_events_prof_event_occurred_at', [
        'professionalId',
        'eventType',
        'occurredAt',
    ])
], ClinicalFlowEvent);
//# sourceMappingURL=clinical-flow-event.entity.js.map