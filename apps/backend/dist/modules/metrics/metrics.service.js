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
const anamnese_entity_1 = require("../anamneses/entities/anamnese.entity");
const atividade_entity_1 = require("../atividades/entities/atividade.entity");
const atividade_checkin_entity_1 = require("../atividades/entities/atividade-checkin.entity");
const laudo_entity_1 = require("../laudos/entities/laudo.entity");
const paciente_entity_1 = require("../pacientes/entities/paciente.entity");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const clinical_flow_event_entity_1 = require("./entities/clinical-flow-event.entity");
const patient_check_click_event_entity_1 = require("./entities/patient-check-click-event.entity");
const STAGES = ['ANAMNESE', 'EXAME_FISICO', 'EVOLUCAO'];
const STRUCTURED_EXAME_PREFIX = '__EXAME_FISICO_STRUCTURED_V1__';
const STATUS_TO_EVENT_TYPE = {
    OPENED: 'STAGE_OPENED',
    COMPLETED: 'STAGE_COMPLETED',
    ABANDONED: 'STAGE_ABANDONED',
    BLOCKED: 'STAGE_BLOCKED',
};
let MetricsService = class MetricsService {
    clinicalFlowRepo;
    patientCheckClickRepo;
    atividadeCheckinRepo;
    laudoRepo;
    pacienteRepo;
    anamneseRepo;
    atividadeRepo;
    constructor(clinicalFlowRepo, patientCheckClickRepo, atividadeCheckinRepo, laudoRepo, pacienteRepo, anamneseRepo, atividadeRepo) {
        this.clinicalFlowRepo = clinicalFlowRepo;
        this.patientCheckClickRepo = patientCheckClickRepo;
        this.atividadeCheckinRepo = atividadeCheckinRepo;
        this.laudoRepo = laudoRepo;
        this.pacienteRepo = pacienteRepo;
        this.anamneseRepo = anamneseRepo;
        this.atividadeRepo = atividadeRepo;
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
    async getClinicalFlowSummary(actorId, actorRole, windowDays = 7, filters) {
        const days = Number.isFinite(windowDays)
            ? Math.min(90, Math.max(1, Math.floor(windowDays)))
            : 7;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const scopedProfessionalId = this.resolveScopedProfessionalId(actorId, actorRole, filters?.professionalId);
        const normalizedStatus = String(filters?.status || '')
            .trim()
            .toUpperCase();
        const scopedEventType = normalizedStatus && normalizedStatus !== 'ALL'
            ? STATUS_TO_EVENT_TYPE[normalizedStatus]
            : undefined;
        const normalizedStage = String(filters?.stage || '')
            .trim()
            .toUpperCase();
        const scopedStage = normalizedStage && normalizedStage !== 'ALL'
            ? normalizedStage
            : undefined;
        const patientId = String(filters?.patientId || '').trim() || undefined;
        const entries = await this.clinicalFlowRepo.find({
            where: {
                professionalId: scopedProfessionalId,
                ...(patientId ? { patientId } : {}),
                ...(scopedEventType ? { eventType: scopedEventType } : {}),
                ...(scopedStage ? { stage: scopedStage } : {}),
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
            filters: {
                professionalId: scopedProfessionalId || null,
                patientId: patientId || null,
                stage: scopedStage || null,
                status: scopedEventType || null,
            },
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
    async getPatientCheckEngagementSummary(actorId, actorRole, windowDays = 7, filters) {
        const days = Number.isFinite(windowDays)
            ? Math.min(90, Math.max(1, Math.floor(windowDays)))
            : 7;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const scopedProfessionalId = this.resolveScopedProfessionalId(actorId, actorRole, filters?.professionalId);
        const patientId = String(filters?.patientId || '').trim() || undefined;
        const status = String(filters?.status || '').trim().toUpperCase() || undefined;
        const scopedPatientIds = await this.resolveScopedPatientIds({
            scopedProfessionalId,
            patientId,
            status,
            windowDays: days,
        });
        if (status && scopedPatientIds && scopedPatientIds.length === 0) {
            return {
                windowDays: days,
                checkClicks: 0,
                checkinsSubmitted: 0,
                conversionRate: 0,
                filters: {
                    professionalId: scopedProfessionalId || null,
                    patientId: patientId || null,
                    status,
                },
            };
        }
        const [checkClicks, checkinsSubmitted] = await Promise.all([
            this.patientCheckClickRepo.count({
                where: {
                    professionalId: scopedProfessionalId,
                    ...(scopedPatientIds
                        ? { patientId: (0, typeorm_2.In)(scopedPatientIds) }
                        : patientId
                            ? { patientId }
                            : {}),
                    occurredAt: (0, typeorm_2.MoreThanOrEqual)(since),
                },
            }),
            this.atividadeCheckinRepo.count({
                where: {
                    usuarioId: scopedProfessionalId,
                    ...(scopedPatientIds
                        ? { pacienteId: (0, typeorm_2.In)(scopedPatientIds) }
                        : patientId
                            ? { pacienteId: patientId }
                            : {}),
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
            filters: {
                professionalId: scopedProfessionalId || null,
                patientId: patientId || null,
                status: status || null,
            },
        };
    }
    async getPhysicalExamTestsSummary(actorId, actorRole, windowDays = 30, filters) {
        const days = Number.isFinite(windowDays)
            ? Math.min(180, Math.max(1, Math.floor(windowDays)))
            : 30;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const scopedProfessionalId = this.resolveScopedProfessionalId(actorId, actorRole, filters?.professionalId);
        const patientId = String(filters?.patientId || '').trim() || undefined;
        const status = String(filters?.status || '').trim().toUpperCase() || undefined;
        const scopedPatientIds = await this.resolveScopedPatientIds({
            scopedProfessionalId,
            patientId,
            status,
            windowDays: days,
        });
        if (status && scopedPatientIds && scopedPatientIds.length === 0) {
            return {
                windowDays: days,
                laudosAnalisados: 0,
                laudosComExameEstruturado: 0,
                totalAvaliados: 0,
                totalPositivos: 0,
                taxaPositividadeGeral: 0,
                porRegiao: [],
                topTestesPositivos: [],
                perfisScoring: [],
                filters: {
                    professionalId: scopedProfessionalId || null,
                    patientId: patientId || null,
                    status: status || null,
                },
            };
        }
        const qb = this.laudoRepo
            .createQueryBuilder('laudo')
            .innerJoin('laudo.paciente', 'paciente')
            .andWhere('laudo.updatedAt >= :since', { since })
            .andWhere('laudo.exame_fisico IS NOT NULL')
            .orderBy('laudo.updatedAt', 'DESC')
            .take(2000);
        if (scopedProfessionalId) {
            qb.andWhere('paciente.usuario_id = :professionalId', {
                professionalId: scopedProfessionalId,
            });
        }
        if (patientId) {
            qb.andWhere('paciente.id = :patientId', { patientId });
        }
        if (scopedPatientIds) {
            qb.andWhere('paciente.id IN (:...patientIds)', { patientIds: scopedPatientIds });
        }
        const laudos = await qb.getMany();
        const regionStats = new Map();
        const topTests = new Map();
        const profileDist = new Map();
        let laudosComExameEstruturado = 0;
        let totalPositivos = 0;
        let totalAvaliados = 0;
        for (const laudo of laudos) {
            const parsed = this.parseStructuredExame(laudo.exameFisico);
            if (!parsed)
                continue;
            laudosComExameEstruturado += 1;
            const perfil = String(parsed?.cruzamentoFinal?.perfilScoring || '').trim();
            if (perfil) {
                profileDist.set(perfil, (profileDist.get(perfil) || 0) + 1);
            }
            const grupos = Array.isArray(parsed?.avaliacaoRegioes)
                ? parsed.avaliacaoRegioes
                : [];
            for (const grupo of grupos) {
                const regiao = String(grupo?.regiao || 'NAO_INFORMADO');
                const titulo = String(grupo?.titulo || regiao);
                const testes = Array.isArray(grupo?.testes) ? grupo.testes : [];
                const avaliadosGrupo = testes.filter((t) => String(t?.resultado || '') !== 'NAO_TESTADO');
                const positivosGrupo = avaliadosGrupo.filter((t) => String(t?.resultado || '') === 'POSITIVO');
                totalAvaliados += avaliadosGrupo.length;
                totalPositivos += positivosGrupo.length;
                const current = regionStats.get(regiao) || {
                    regiao,
                    titulo,
                    positivos: 0,
                    avaliados: 0,
                };
                current.avaliados += avaliadosGrupo.length;
                current.positivos += positivosGrupo.length;
                regionStats.set(regiao, current);
                for (const teste of positivosGrupo) {
                    const nome = String(teste?.nome || 'Teste');
                    topTests.set(nome, (topTests.get(nome) || 0) + 1);
                }
            }
        }
        const porRegiao = Array.from(regionStats.values())
            .map((item) => ({
            ...item,
            taxaPositividade: item.avaliados > 0
                ? Math.round((item.positivos / item.avaliados) * 100)
                : 0,
        }))
            .sort((a, b) => b.positivos - a.positivos);
        const topTestesPositivos = Array.from(topTests.entries())
            .map(([teste, count]) => ({ teste, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 12);
        const perfisScoring = Array.from(profileDist.entries())
            .map(([perfil, count]) => ({ perfil, count }))
            .sort((a, b) => b.count - a.count);
        return {
            windowDays: days,
            laudosAnalisados: laudos.length,
            laudosComExameEstruturado,
            totalAvaliados,
            totalPositivos,
            taxaPositividadeGeral: totalAvaliados > 0 ? Math.round((totalPositivos / totalAvaliados) * 100) : 0,
            porRegiao,
            topTestesPositivos,
            perfisScoring,
            filters: {
                professionalId: scopedProfessionalId || null,
                patientId: patientId || null,
                status: status || null,
            },
        };
    }
    resolveScopedProfessionalId(actorId, actorRole, requestedProfessionalId) {
        const normalized = String(requestedProfessionalId || '').trim();
        if (actorRole === usuario_entity_1.UserRole.ADMIN) {
            return normalized || undefined;
        }
        return actorId;
    }
    async resolveScopedPatientIds(params) {
        const { scopedProfessionalId, patientId, status, windowDays } = params;
        if (patientId)
            return [patientId];
        if (!status || status === 'ALL' || status === 'TODOS')
            return undefined;
        const pacientes = await this.pacienteRepo.find({
            where: {
                ativo: true,
                ...(scopedProfessionalId ? { usuarioId: scopedProfessionalId } : {}),
            },
            select: [
                'id',
                'createdAt',
                'pacienteUsuarioId',
                'vinculoStatus',
            ],
        });
        if (!pacientes.length)
            return [];
        const pacienteIds = pacientes.map((p) => p.id);
        const anamneses = await this.anamneseRepo.find({
            where: { pacienteId: (0, typeorm_2.In)(pacienteIds) },
            select: ['pacienteId'],
        });
        const hasAnamnese = new Set(anamneses.map((x) => x.pacienteId));
        const laudos = await this.laudoRepo
            .createQueryBuilder('l')
            .where('l.pacienteId IN (:...pacienteIds)', { pacienteIds })
            .orderBy('l.pacienteId', 'ASC')
            .addOrderBy('l.updatedAt', 'DESC')
            .getMany();
        const latestLaudoByPaciente = new Map();
        laudos.forEach((item) => {
            if (!latestLaudoByPaciente.has(item.pacienteId)) {
                latestLaudoByPaciente.set(item.pacienteId, item);
            }
        });
        const atividadesAtivas = await this.atividadeRepo
            .createQueryBuilder('a')
            .select('a.pacienteId', 'pacienteId')
            .where('a.ativo = :ativo', { ativo: true })
            .andWhere('a.pacienteId IN (:...pacienteIds)', { pacienteIds })
            .groupBy('a.pacienteId')
            .getRawMany();
        const hasActiveActivity = new Set(atividadesAtivas.map((r) => r.pacienteId));
        const now = Date.now();
        const activityWindowMs = Math.max(1, windowDays) * 24 * 60 * 60 * 1000;
        const filteredIds = [];
        for (const paciente of pacientes) {
            const hasAnamnesePaciente = hasAnamnese.has(paciente.id);
            const lastLaudo = latestLaudoByPaciente.get(paciente.id);
            const hasAltaDocumento = lastLaudo?.status === laudo_entity_1.LaudoStatus.VALIDADO_PROFISSIONAL &&
                !!lastLaudo.criteriosAlta;
            const tratamentoConcluido = hasAltaDocumento && !hasActiveActivity.has(paciente.id);
            const aguardandoVinculo = !paciente.pacienteUsuarioId ||
                paciente.vinculoStatus === paciente_entity_1.PacienteVinculoStatus.SEM_VINCULO ||
                paciente.vinculoStatus === paciente_entity_1.PacienteVinculoStatus.CONVITE_ENVIADO;
            const isNovoPaciente = !hasAnamnesePaciente &&
                now - new Date(paciente.createdAt).getTime() <= activityWindowMs;
            const matchesStatus = (status === 'NOVO_PACIENTE' && isNovoPaciente) ||
                (status === 'AGUARDANDO_VINCULO' && aguardandoVinculo) ||
                (status === 'ANAMNESE_PENDENTE' && !hasAnamnesePaciente) ||
                (status === 'EM_TRATAMENTO' && hasAnamnesePaciente && !tratamentoConcluido) ||
                (status === 'ALTA' && tratamentoConcluido);
            if (matchesStatus) {
                filteredIds.push(paciente.id);
            }
        }
        return filteredIds;
    }
    parseStructuredExame(rawValue) {
        const raw = String(rawValue || '').trim();
        if (!raw.startsWith(STRUCTURED_EXAME_PREFIX))
            return null;
        const json = raw.slice(STRUCTURED_EXAME_PREFIX.length);
        if (!json)
            return null;
        try {
            return JSON.parse(json);
        }
        catch {
            return null;
        }
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(clinical_flow_event_entity_1.ClinicalFlowEvent)),
    __param(1, (0, typeorm_1.InjectRepository)(patient_check_click_event_entity_1.PatientCheckClickEvent)),
    __param(2, (0, typeorm_1.InjectRepository)(atividade_checkin_entity_1.AtividadeCheckin)),
    __param(3, (0, typeorm_1.InjectRepository)(laudo_entity_1.Laudo)),
    __param(4, (0, typeorm_1.InjectRepository)(paciente_entity_1.Paciente)),
    __param(5, (0, typeorm_1.InjectRepository)(anamnese_entity_1.Anamnese)),
    __param(6, (0, typeorm_1.InjectRepository)(atividade_entity_1.Atividade)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map