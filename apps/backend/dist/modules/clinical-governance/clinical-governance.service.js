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
exports.ClinicalGovernanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const clinical_audit_log_entity_1 = require("./entities/clinical-audit-log.entity");
const consent_purpose_log_entity_1 = require("./entities/consent-purpose-log.entity");
const clinical_protocol_version_entity_1 = require("./entities/clinical-protocol-version.entity");
let ClinicalGovernanceService = class ClinicalGovernanceService {
    protocolRepository;
    consentRepository;
    auditRepository;
    usuarioRepository;
    constructor(protocolRepository, consentRepository, auditRepository, usuarioRepository) {
        this.protocolRepository = protocolRepository;
        this.consentRepository = consentRepository;
        this.auditRepository = auditRepository;
        this.usuarioRepository = usuarioRepository;
    }
    async getActiveProtocol(usuario) {
        const active = await this.protocolRepository.findOne({
            where: { isActive: true },
            order: { activatedAt: 'DESC', createdAt: 'DESC' },
        });
        await this.writeAudit({
            actor: usuario,
            actionType: 'READ',
            action: 'protocol.active.read',
            resourceType: 'CLINICAL_PROTOCOL',
            resourceId: active?.id || null,
        });
        return active;
    }
    async getProtocolHistory(usuario, limit = 20) {
        this.assertAdmin(usuario);
        const safeLimit = Number.isFinite(limit)
            ? Math.min(Math.max(limit, 1), 100)
            : 20;
        const rows = await this.protocolRepository.find({
            order: { createdAt: 'DESC' },
            take: safeLimit,
        });
        await this.writeAudit({
            actor: usuario,
            actionType: 'READ',
            action: 'protocol.history.read',
            resourceType: 'CLINICAL_PROTOCOL',
            metadata: { limit: safeLimit, count: rows.length },
        });
        return rows;
    }
    async activateProtocol(dto, usuario) {
        this.assertAdmin(usuario);
        const now = new Date();
        const current = await this.protocolRepository.findOne({
            where: { isActive: true },
            order: { activatedAt: 'DESC', createdAt: 'DESC' },
        });
        if (current &&
            current.version === dto.version &&
            current.name.trim().toLowerCase() === dto.name.trim().toLowerCase()) {
            throw new common_1.BadRequestException('Protocolo ja ativo com mesma versao e nome');
        }
        if (current) {
            current.isActive = false;
            current.deactivatedAt = now;
            await this.protocolRepository.save(current);
        }
        const created = this.protocolRepository.create({
            name: dto.name.trim(),
            version: dto.version.trim(),
            isActive: true,
            activatedAt: now,
            activatedBy: usuario.id,
            definition: dto.definition || {},
        });
        const saved = await this.protocolRepository.save(created);
        await this.writeAudit({
            actor: usuario,
            actionType: 'APPROVAL',
            action: 'protocol.activate',
            resourceType: 'CLINICAL_PROTOCOL',
            resourceId: saved.id,
            metadata: {
                name: saved.name,
                version: saved.version,
                previousProtocolId: current?.id || null,
            },
        });
        return saved;
    }
    async upsertMyConsent(usuario, dto) {
        const source = (dto.source || 'APP').trim().toUpperCase();
        const now = new Date();
        await this.usuarioRepository.manager.transaction(async (tx) => {
            const userRepo = tx.getRepository(usuario_entity_1.Usuario);
            const consentRepo = tx.getRepository(consent_purpose_log_entity_1.ConsentPurposeLog);
            const user = await userRepo.findOne({ where: { id: usuario.id } });
            if (!user) {
                throw new common_1.BadRequestException('Usuario nao encontrado');
            }
            const activeProtocol = await tx.getRepository(clinical_protocol_version_entity_1.ClinicalProtocolVersion).findOne({
                where: { isActive: true },
                order: { activatedAt: 'DESC', createdAt: 'DESC' },
            });
            this.applyConsentToUser(user, dto.purpose, dto.accepted, now);
            await userRepo.save(user);
            const log = consentRepo.create({
                userId: user.id,
                purpose: dto.purpose,
                accepted: dto.accepted,
                acceptedAt: dto.accepted ? now : null,
                protocolVersion: activeProtocol?.version || null,
                source,
                changedBy: usuario.id,
            });
            await consentRepo.save(log);
        });
        await this.writeAudit({
            actor: usuario,
            actionType: 'EDIT',
            action: 'consent.upsert',
            resourceType: 'CONSENT',
            resourceId: `${usuario.id}:${dto.purpose}`,
            metadata: { accepted: dto.accepted, source },
        });
        return this.getMyConsents(usuario);
    }
    async getMyConsents(usuario) {
        const user = await this.usuarioRepository.findOne({ where: { id: usuario.id } });
        if (!user)
            throw new common_1.BadRequestException('Usuario nao encontrado');
        const latestLogs = await this.consentRepository.find({
            where: { userId: usuario.id },
            order: { createdAt: 'DESC' },
            take: 30,
        });
        await this.writeAudit({
            actor: usuario,
            actionType: 'READ',
            action: 'consent.my.read',
            resourceType: 'CONSENT',
            resourceId: usuario.id,
            metadata: { logs: latestLogs.length },
        });
        return {
            userId: user.id,
            role: user.role,
            snapshot: {
                consentTermsRequired: user.consentTermsRequired,
                consentPrivacyRequired: user.consentPrivacyRequired,
                consentResearchOptional: user.consentResearchOptional,
                consentAiOptional: user.consentAiOptional,
                consentProfessionalLgpdRequired: user.consentProfessionalLgpdRequired,
                consentAcceptedAt: user.consentAcceptedAt,
            },
            history: latestLogs,
        };
    }
    async listAuditLogs(usuario, params) {
        this.assertAdmin(usuario);
        const take = Number.isFinite(params.limit)
            ? Math.min(Math.max(Number(params.limit), 1), 200)
            : 50;
        const qb = this.auditRepository
            .createQueryBuilder('a')
            .orderBy('a.created_at', 'DESC')
            .take(take);
        if (params.actionType)
            qb.andWhere('a.action_type = :actionType', { actionType: params.actionType });
        if (params.patientId)
            qb.andWhere('a.patient_id = :patientId', { patientId: params.patientId });
        const rows = await qb.getMany();
        await this.writeAudit({
            actor: usuario,
            actionType: 'READ',
            action: 'audit.logs.read',
            resourceType: 'AUDIT_LOG',
            metadata: {
                actionType: params.actionType || null,
                patientId: params.patientId || null,
                limit: take,
                count: rows.length,
            },
        });
        return { items: rows, count: rows.length };
    }
    async getAiSuggestionSummary(usuario, params) {
        this.assertAdmin(usuario);
        const safeWindowDays = Number.isFinite(params?.windowDays)
            ? Math.min(Math.max(Number(params?.windowDays), 1), 90)
            : 7;
        const since = new Date(Date.now() - safeWindowDays * 24 * 60 * 60 * 1000);
        const professionalId = String(params?.professionalId || '').trim() || null;
        const patientId = String(params?.patientId || '').trim() || null;
        const qb = this.auditRepository
            .createQueryBuilder('a')
            .where('a.created_at >= :since', { since: since.toISOString() })
            .andWhere('a.resource_type = :resourceType', { resourceType: 'AI_SUGGESTION' })
            .andWhere('a.action IN (:...actions)', {
            actions: ['orchestrator.ai_suggestion.read', 'ai.suggestion.applied'],
        });
        if (professionalId) {
            qb.andWhere('a.actor_id = :professionalId', { professionalId });
        }
        if (patientId) {
            qb.andWhere('a.patient_id = :patientId', { patientId });
        }
        const rows = await qb.orderBy('a.created_at', 'DESC').take(5000).getMany();
        const stageCounters = {
            EXAME_FISICO: { reads: 0, applied: 0, confirmed: 0 },
            EVOLUCAO: { reads: 0, applied: 0, confirmed: 0 },
            LAUDO: { reads: 0, applied: 0, confirmed: 0 },
            PLANO: { reads: 0, applied: 0, confirmed: 0 },
            OUTROS: { reads: 0, applied: 0, confirmed: 0 },
        };
        let totalReads = 0;
        let totalApplied = 0;
        let totalConfirmed = 0;
        const timelineMap = new Map();
        const resolveStage = (value) => {
            const normalized = String(value || '').trim().toUpperCase();
            if (normalized === 'EXAME_FISICO')
                return 'EXAME_FISICO';
            if (normalized === 'EVOLUCAO')
                return 'EVOLUCAO';
            if (normalized === 'LAUDO')
                return 'LAUDO';
            if (normalized === 'PLANO')
                return 'PLANO';
            return 'OUTROS';
        };
        for (const row of rows) {
            const metadata = (row.metadata || {});
            const stage = resolveStage(metadata.stage);
            const suggestionType = String(metadata.suggestionType || '').toUpperCase();
            const isRead = row.action === 'orchestrator.ai_suggestion.read';
            const isConfirmed = suggestionType.endsWith('_CONFIRMED') ||
                suggestionType.endsWith('_REVIEWED');
            const dateKey = (() => {
                const parsed = new Date(row.createdAt || since);
                const safe = Number.isNaN(parsed.getTime()) ? since : parsed;
                return safe.toISOString().slice(0, 10);
            })();
            const timelineBucket = timelineMap.get(dateKey) || { reads: 0, applied: 0, confirmed: 0 };
            if (isRead) {
                totalReads += 1;
                stageCounters[stage].reads += 1;
                timelineBucket.reads += 1;
                timelineMap.set(dateKey, timelineBucket);
                continue;
            }
            totalApplied += 1;
            stageCounters[stage].applied += 1;
            timelineBucket.applied += 1;
            if (isConfirmed) {
                totalConfirmed += 1;
                stageCounters[stage].confirmed += 1;
                timelineBucket.confirmed += 1;
            }
            timelineMap.set(dateKey, timelineBucket);
        }
        const adoptionRate = totalReads > 0 ? Number((totalApplied / totalReads).toFixed(4)) : 0;
        const confirmationRate = totalApplied > 0 ? Number((totalConfirmed / totalApplied).toFixed(4)) : 0;
        await this.writeAudit({
            actor: usuario,
            actionType: 'READ',
            action: 'ai.suggestions.summary.read',
            resourceType: 'AI_SUGGESTION',
            metadata: {
                windowDays: safeWindowDays,
                professionalId,
                patientId,
                rows: rows.length,
                totalReads,
                totalApplied,
                totalConfirmed,
                adoptionRate,
                confirmationRate,
            },
        });
        const timeline = Array.from(timelineMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, values]) => ({
            date,
            reads: values.reads,
            applied: values.applied,
            confirmed: values.confirmed,
        }));
        return {
            windowDays: safeWindowDays,
            since,
            filters: {
                professionalId,
                patientId,
            },
            totals: {
                reads: totalReads,
                applied: totalApplied,
                confirmed: totalConfirmed,
                adoptionRate,
                confirmationRate,
            },
            byStage: stageCounters,
            timeline,
        };
    }
    async writeAudit(input) {
        try {
            const row = this.auditRepository.create({
                actorId: input.actor?.id || null,
                actorRole: input.actor?.role || null,
                actionType: input.actionType,
                action: input.action,
                resourceType: input.resourceType || null,
                resourceId: input.resourceId || null,
                patientId: input.patientId || null,
                metadata: input.metadata || {},
            });
            await this.auditRepository.save(row);
        }
        catch {
        }
    }
    async logAiSuggestion(usuario, dto) {
        const protocol = await this.protocolRepository.findOne({
            where: { isActive: true },
            order: { activatedAt: 'DESC', createdAt: 'DESC' },
        });
        await this.writeAudit({
            actor: usuario,
            actionType: 'APPROVAL',
            action: 'ai.suggestion.applied',
            resourceType: 'AI_SUGGESTION',
            resourceId: `${dto.stage}:${dto.suggestionType}`,
            patientId: dto.patientId || null,
            metadata: {
                stage: dto.stage,
                suggestionType: dto.suggestionType,
                confidence: dto.confidence,
                reason: dto.reason,
                evidenceFields: Array.isArray(dto.evidenceFields)
                    ? dto.evidenceFields
                    : [],
                protocolVersion: protocol?.version || null,
                protocolName: protocol?.name || null,
            },
        });
        return {
            ok: true,
            protocolVersion: protocol?.version || null,
        };
    }
    applyConsentToUser(user, purpose, accepted, when) {
        if (purpose === 'TERMS_REQUIRED')
            user.consentTermsRequired = accepted;
        if (purpose === 'PRIVACY_REQUIRED')
            user.consentPrivacyRequired = accepted;
        if (purpose === 'RESEARCH_OPTIONAL')
            user.consentResearchOptional = accepted;
        if (purpose === 'AI_OPTIONAL')
            user.consentAiOptional = accepted;
        if (purpose === 'PROFESSIONAL_LGPD_REQUIRED') {
            user.consentProfessionalLgpdRequired = accepted;
            if (user.role !== usuario_entity_1.UserRole.ADMIN && user.role !== usuario_entity_1.UserRole.USER) {
                throw new common_1.ForbiddenException('Consentimento LGPD profissional so pode ser usado por profissional/admin');
            }
        }
        if (user.consentTermsRequired &&
            user.consentPrivacyRequired &&
            !user.consentAcceptedAt) {
            user.consentAcceptedAt = when;
        }
    }
    assertAdmin(usuario) {
        if (usuario.role !== usuario_entity_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Acesso restrito a administradores');
        }
    }
};
exports.ClinicalGovernanceService = ClinicalGovernanceService;
exports.ClinicalGovernanceService = ClinicalGovernanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(clinical_protocol_version_entity_1.ClinicalProtocolVersion)),
    __param(1, (0, typeorm_1.InjectRepository)(consent_purpose_log_entity_1.ConsentPurposeLog)),
    __param(2, (0, typeorm_1.InjectRepository)(clinical_audit_log_entity_1.ClinicalAuditLog)),
    __param(3, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ClinicalGovernanceService);
//# sourceMappingURL=clinical-governance.service.js.map