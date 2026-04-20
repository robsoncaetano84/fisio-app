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
exports.PatientCheckClickEvent = void 0;
const typeorm_1 = require("typeorm");
let PatientCheckClickEvent = class PatientCheckClickEvent {
    id;
    professionalId;
    patientId;
    source;
    occurredAt;
    createdAt;
};
exports.PatientCheckClickEvent = PatientCheckClickEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PatientCheckClickEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'professional_id', type: 'uuid' }),
    __metadata("design:type", String)
], PatientCheckClickEvent.prototype, "professionalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'patient_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], PatientCheckClickEvent.prototype, "patientId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source', type: 'varchar', length: 40, nullable: true }),
    __metadata("design:type", Object)
], PatientCheckClickEvent.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'occurred_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], PatientCheckClickEvent.prototype, "occurredAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], PatientCheckClickEvent.prototype, "createdAt", void 0);
exports.PatientCheckClickEvent = PatientCheckClickEvent = __decorate([
    (0, typeorm_1.Entity)('patient_check_click_events'),
    (0, typeorm_1.Index)('idx_patient_check_click_events_prof_occurred_at', ['professionalId', 'occurredAt'])
], PatientCheckClickEvent);
//# sourceMappingURL=patient-check-click-event.entity.js.map