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
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const atividade_checkin_entity_1 = require("../atividades/entities/atividade-checkin.entity");
const clinical_flow_event_entity_1 = require("./entities/clinical-flow-event.entity");
const patient_check_click_event_entity_1 = require("./entities/patient-check-click-event.entity");
const STAGES = ['ANAMNESE', 'EXAME_FISICO', 'EVOLUCAO'];
let MetricsService = class MetricsService {
    clinicalFlowRepo;
    patientCheckClickRepo;
    atividadeCheckinRepo;
    constructor(clinicalFlowRepo, patientCheckClickRepo, atividadeCheckinRepo) {
        this.clinicalFlowRepo = clinicalFlowRepo;
        this.patientCheckClickRepo = patientCheckClickRepo;
        this.atividadeCheckinRepo = atividadeCheckinRepo;
    }
    async trackClinicalFlowEvent(professionalId, dto) {
        const blockedReason = dto.eventType === 'STAGE_BLOCKED' && dto.blockedReason
            ? dto.blockedReason.trim().slice(0, 80)
            : null;
        const created = this.clinicalFlowRepo.create({
            professionalId,
            patientId: dto.patientId || null,
            stage: dto.stage,
            eventType: dto.eventType,
            durationMs: dto.durationMs ?? null,
            blockedReason,
        });
        await this.clinicalFlowRepo.save(created);
        return { ok: true };
    }
    async getClinicalFlowSummary(professionalId, windowDays = 7) {
        const days = Number.isFinite(windowDays)
            ? Math.max(1, Math.floor(windowDays))
            : 7;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const entries = await this.clinicalFlowRepo.find({
            where: {
                professionalId,
                occurredAt: (0, typeorm_2.MoreThanOrEqual)(since),
            },
            order: { occurredAt: 'DESC' },
            take: 5000,
        });
        let opened = 0;
        let completed = 0;
        let abandoned = 0;
        let blocked = 0;
        const stageDurationSums = {
            ANAMNESE: 0,
            EXAME_FISICO: 0,
            EVOLUCAO: 0,
        };
        const stageDurationCounts = {
            ANAMNESE: 0,
            EXAME_FISICO: 0,
            EVOLUCAO: 0,
        };
        const blockedReasons = new Map();
        entries.forEach((entry) => {
            if (entry.eventType === 'STAGE_OPENED')
                opened += 1;
            if (entry.eventType === 'STAGE_COMPLETED') {
                completed += 1;
                if (typeof entry.durationMs === 'number' && entry.durationMs >= 0) {
                    stageDurationSums[entry.stage] += Math.round(entry.durationMs);
                    stageDurationCounts[entry.stage] += 1;
                }
            }
            if (entry.eventType === 'STAGE_ABANDONED')
                abandoned += 1;
            if (entry.eventType === 'STAGE_BLOCKED') {
                blocked += 1;
                const reason = entry.blockedReason || 'UNKNOWN';
                blockedReasons.set(reason, (blockedReasons.get(reason) || 0) + 1);
            }
        });
        const avgDurationMsByStage = {
            ANAMNESE: stageDurationCounts.ANAMNESE > 0
                ? Math.round(stageDurationSums.ANAMNESE / stageDurationCounts.ANAMNESE)
                : 0,
            EXAME_FISICO: stageDurationCounts.EXAME_FISICO > 0
                ? Math.round(stageDurationSums.EXAME_FISICO / stageDurationCounts.EXAME_FISICO)
                : 0,
            EVOLUCAO: stageDurationCounts.EVOLUCAO > 0
                ? Math.round(stageDurationSums.EVOLUCAO / stageDurationCounts.EVOLUCAO)
                : 0,
        };
        const topBlockedReasons = Array.from(blockedReasons.entries())
            .map(([reason, count]) => ({ reason, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
        const abandonmentRate = opened > 0 ? Math.round((abandoned / opened) * 100) : 0;
        return {
            windowDays: days,
            opened,
            completed,
            abandoned,
            blocked,
            abandonmentRate,
            avgDurationMsByStage,
            topBlockedReasons,
            trackedStages: STAGES,
        };
    }
    async trackPatientCheckClick(professionalId, dto) {
        const source = dto.source?.trim().slice(0, 40) || null;
        const created = this.patientCheckClickRepo.create({
            professionalId,
            patientId: dto.patientId || null,
            source,
        });
        await this.patientCheckClickRepo.save(created);
        return { ok: true };
    }
    async getPatientCheckEngagementSummary(professionalId, windowDays = 7) {
        const days = Number.isFinite(windowDays)
            ? Math.max(1, Math.floor(windowDays))
            : 7;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const [checkClicks, checkinsSubmitted] = await Promise.all([
            this.patientCheckClickRepo.count({
                where: {
                    professionalId,
                    occurredAt: (0, typeorm_2.MoreThanOrEqual)(since),
                },
            }),
            this.atividadeCheckinRepo.count({
                where: {
                    usuarioId: professionalId,
                    createdAt: (0, typeorm_2.MoreThanOrEqual)(since),
                },
            }),
        ]);
        const conversionRate = checkClicks > 0 ? Math.round((checkinsSubmitted / checkClicks) * 100) : 0;
        return {
            windowDays: days,
            checkClicks,
            checkinsSubmitted,
            conversionRate,
        };
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(clinical_flow_event_entity_1.ClinicalFlowEvent)),
    __param(1, (0, typeorm_1.InjectRepository)(patient_check_click_event_entity_1.PatientCheckClickEvent)),
    __param(2, (0, typeorm_1.InjectRepository)(atividade_checkin_entity_1.AtividadeCheckin)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map