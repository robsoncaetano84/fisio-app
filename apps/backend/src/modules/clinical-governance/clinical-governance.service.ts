import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole, Usuario } from '../usuarios/entities/usuario.entity';
import { ActivateProtocolDto } from './dto/activate-protocol.dto';
import { LogAiSuggestionDto } from './dto/log-ai-suggestion.dto';
import { UpsertConsentDto } from './dto/upsert-consent.dto';
import { ClinicalAuditActionType, ClinicalAuditLog } from './entities/clinical-audit-log.entity';
import {
  ConsentPurpose,
  ConsentPurposeLog,
} from './entities/consent-purpose-log.entity';
import { ClinicalProtocolVersion } from './entities/clinical-protocol-version.entity';

@Injectable()
export class ClinicalGovernanceService {
  constructor(
    @InjectRepository(ClinicalProtocolVersion)
    private readonly protocolRepository: Repository<ClinicalProtocolVersion>,
    @InjectRepository(ConsentPurposeLog)
    private readonly consentRepository: Repository<ConsentPurposeLog>,
    @InjectRepository(ClinicalAuditLog)
    private readonly auditRepository: Repository<ClinicalAuditLog>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async getActiveProtocol(usuario: Usuario) {
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

  async getProtocolHistory(usuario: Usuario, limit = 20) {
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

  async activateProtocol(dto: ActivateProtocolDto, usuario: Usuario) {
    this.assertAdmin(usuario);

    const now = new Date();
    const current = await this.protocolRepository.findOne({
      where: { isActive: true },
      order: { activatedAt: 'DESC', createdAt: 'DESC' },
    });

    if (
      current &&
      current.version === dto.version &&
      current.name.trim().toLowerCase() === dto.name.trim().toLowerCase()
    ) {
      throw new BadRequestException('Protocolo ja ativo com mesma versao e nome');
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

  async upsertMyConsent(usuario: Usuario, dto: UpsertConsentDto) {
    const source = (dto.source || 'APP').trim().toUpperCase();
    const now = new Date();

    await this.usuarioRepository.manager.transaction(async (tx) => {
      const userRepo = tx.getRepository(Usuario);
      const consentRepo = tx.getRepository(ConsentPurposeLog);

      const user = await userRepo.findOne({ where: { id: usuario.id } });
      if (!user) {
        throw new BadRequestException('Usuario nao encontrado');
      }

      const activeProtocol = await tx.getRepository(ClinicalProtocolVersion).findOne({
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

  async getMyConsents(usuario: Usuario) {
    const user = await this.usuarioRepository.findOne({ where: { id: usuario.id } });
    if (!user) throw new BadRequestException('Usuario nao encontrado');

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

  async listAuditLogs(
    usuario: Usuario,
    params: {
      actionType?: ClinicalAuditActionType;
      patientId?: string;
      limit?: number;
    },
  ) {
    this.assertAdmin(usuario);
    const take = Number.isFinite(params.limit)
      ? Math.min(Math.max(Number(params.limit), 1), 200)
      : 50;
    const qb = this.auditRepository
      .createQueryBuilder('a')
      .orderBy('a.created_at', 'DESC')
      .take(take);

    if (params.actionType) qb.andWhere('a.action_type = :actionType', { actionType: params.actionType });
    if (params.patientId) qb.andWhere('a.patient_id = :patientId', { patientId: params.patientId });

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

  async getAiSuggestionSummary(
    usuario: Usuario,
    params?: { windowDays?: number },
  ) {
    this.assertAdmin(usuario);
    const safeWindowDays = Number.isFinite(params?.windowDays)
      ? Math.min(Math.max(Number(params?.windowDays), 1), 90)
      : 7;
    const since = new Date(Date.now() - safeWindowDays * 24 * 60 * 60 * 1000);

    const rows = await this.auditRepository
      .createQueryBuilder('a')
      .where('a.created_at >= :since', { since: since.toISOString() })
      .andWhere('a.resource_type = :resourceType', { resourceType: 'AI_SUGGESTION' })
      .andWhere('a.action IN (:...actions)', {
        actions: ['orchestrator.ai_suggestion.read', 'ai.suggestion.applied'],
      })
      .orderBy('a.created_at', 'DESC')
      .take(5000)
      .getMany();

    type StageKey = 'EXAME_FISICO' | 'EVOLUCAO' | 'LAUDO' | 'PLANO' | 'OUTROS';
    const stageCounters: Record<
      StageKey,
      { reads: number; applied: number; confirmed: number }
    > = {
      EXAME_FISICO: { reads: 0, applied: 0, confirmed: 0 },
      EVOLUCAO: { reads: 0, applied: 0, confirmed: 0 },
      LAUDO: { reads: 0, applied: 0, confirmed: 0 },
      PLANO: { reads: 0, applied: 0, confirmed: 0 },
      OUTROS: { reads: 0, applied: 0, confirmed: 0 },
    };

    let totalReads = 0;
    let totalApplied = 0;
    let totalConfirmed = 0;
    const timelineMap = new Map<
      string,
      { reads: number; applied: number; confirmed: number }
    >();

    const resolveStage = (value?: string | null): StageKey => {
      const normalized = String(value || '').trim().toUpperCase();
      if (normalized === 'EXAME_FISICO') return 'EXAME_FISICO';
      if (normalized === 'EVOLUCAO') return 'EVOLUCAO';
      if (normalized === 'LAUDO') return 'LAUDO';
      if (normalized === 'PLANO') return 'PLANO';
      return 'OUTROS';
    };

    for (const row of rows) {
      const metadata = (row.metadata || {}) as Record<string, any>;
      const stage = resolveStage(metadata.stage);
      const suggestionType = String(metadata.suggestionType || '').toUpperCase();
      const isRead = row.action === 'orchestrator.ai_suggestion.read';
      const isConfirmed =
        suggestionType.endsWith('_CONFIRMED') ||
        suggestionType.endsWith('_REVIEWED');
      const dateKey = (() => {
        const parsed = new Date((row as any).createdAt || since);
        const safe = Number.isNaN(parsed.getTime()) ? since : parsed;
        return safe.toISOString().slice(0, 10);
      })();
      const timelineBucket =
        timelineMap.get(dateKey) || { reads: 0, applied: 0, confirmed: 0 };

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

  async writeAudit(input: {
    actor: Usuario | null;
    actionType: ClinicalAuditActionType;
    action: string;
    resourceType?: string | null;
    resourceId?: string | null;
    patientId?: string | null;
    metadata?: Record<string, any>;
  }): Promise<void> {
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
    } catch {
      // best-effort audit
    }
  }

  async logAiSuggestion(usuario: Usuario, dto: LogAiSuggestionDto) {
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

  private applyConsentToUser(
    user: Usuario,
    purpose: ConsentPurpose,
    accepted: boolean,
    when: Date,
  ) {
    if (purpose === 'TERMS_REQUIRED') user.consentTermsRequired = accepted;
    if (purpose === 'PRIVACY_REQUIRED') user.consentPrivacyRequired = accepted;
    if (purpose === 'RESEARCH_OPTIONAL') user.consentResearchOptional = accepted;
    if (purpose === 'AI_OPTIONAL') user.consentAiOptional = accepted;
    if (purpose === 'PROFESSIONAL_LGPD_REQUIRED') {
      user.consentProfessionalLgpdRequired = accepted;
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.USER) {
        throw new ForbiddenException(
          'Consentimento LGPD profissional so pode ser usado por profissional/admin',
        );
      }
    }

    if (
      user.consentTermsRequired &&
      user.consentPrivacyRequired &&
      !user.consentAcceptedAt
    ) {
      user.consentAcceptedAt = when;
    }
  }

  private assertAdmin(usuario: Usuario): void {
    if (usuario.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Acesso restrito a administradores');
    }
  }
}
