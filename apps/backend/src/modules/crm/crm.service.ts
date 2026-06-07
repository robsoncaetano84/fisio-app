// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// C RM.SERVICE
// ==========================================
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { PacienteVinculoStatus } from '../pacientes/entities/paciente.entity';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Atividade } from '../atividades/entities/atividade.entity';
import { AtividadeCheckin } from '../atividades/entities/atividade-checkin.entity';
import { Laudo, LaudoStatus } from '../laudos/entities/laudo.entity';
import { CreateCrmLeadDto } from './dto/create-crm-lead.dto';
import { UpdateCrmLeadDto } from './dto/update-crm-lead.dto';
import { CreateCrmTaskDto } from './dto/create-crm-task.dto';
import { UpdateCrmTaskDto } from './dto/update-crm-task.dto';
import { CreateCrmInteractionDto } from './dto/create-crm-interaction.dto';
import { UpdateCrmInteractionDto } from './dto/update-crm-interaction.dto';
import { UpdateCrmAdminProfessionalDto } from './dto/update-crm-admin-professional.dto';
import { UpdateCrmAdminPatientDto } from './dto/update-crm-admin-patient.dto';
import { UpdateCrmAutomationActionDto } from './dto/update-crm-automation-action.dto';
import { CrmLead, CrmLeadStage } from './entities/crm-lead.entity';
import { CrmTask, CrmTaskStatus } from './entities/crm-task.entity';
import { CrmInteraction } from './entities/crm-interaction.entity';
import { ClinicalFlowEvent } from '../metrics/entities/clinical-flow-event.entity';
import { CrmAdminAuditLog } from './entities/crm-admin-audit-log.entity';
import {
  CrmAutomationAction,
  CrmAutomationActionType,
  CrmAutomationHistoryEventType,
  CrmAutomationSeverity,
  CrmAutomationStatus,
  CrmAutomationTargetType,
} from './entities/crm-automation-action.entity';
import {
  parseCrmAdminPermissionsConfig,
  resolveCrmAdminPermissions,
  type CrmAdminPermission,
} from './crm-admin-permissions.util';
import {
  mapCrmAdminPatient,
  mapCrmAdminProfessional,
} from './crm-admin.mapper';
import {
  buildCrmClinicalDashboardSummary,
  buildEmptyCrmClinicalDashboardSummary,
  type CrmClinicalDashboardBlockedReasonRow,
  type CrmClinicalDashboardFlowRow,
} from './crm-clinical-dashboard-summary.util';
import {
  buildCrmCommandCenterSummary,
  type CrmCommandCenterItem,
  type CrmCommandCenterLeadSignal,
  type CrmCommandCenterPatientSignal,
  type CrmCommandCenterProfessionalSignal,
  type CrmCommandCenterTaskSignal,
} from './crm-command-center.util';
import { mapCrmInteraction, mapCrmLead, mapCrmTask } from './crm-entity.mapper';

export type { CrmAdminPermission } from './crm-admin-permissions.util';

@Injectable()
export class CrmService {
  private permissionsCacheRaw: string | null = null;
  private permissionsCache: Map<string, Set<CrmAdminPermission>> | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(CrmLead)
    private readonly crmLeadRepository: Repository<CrmLead>,
    @InjectRepository(CrmTask)
    private readonly crmTaskRepository: Repository<CrmTask>,
    @InjectRepository(CrmInteraction)
    private readonly crmInteractionRepository: Repository<CrmInteraction>,
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Anamnese)
    private readonly anamneseRepository: Repository<Anamnese>,
    @InjectRepository(Evolucao)
    private readonly evolucaoRepository: Repository<Evolucao>,
    @InjectRepository(Atividade)
    private readonly atividadeRepository: Repository<Atividade>,
    @InjectRepository(AtividadeCheckin)
    private readonly atividadeCheckinRepository: Repository<AtividadeCheckin>,
    @InjectRepository(Laudo)
    private readonly laudoRepository: Repository<Laudo>,
    @InjectRepository(ClinicalFlowEvent)
    private readonly clinicalFlowEventRepository: Repository<ClinicalFlowEvent>,
    @InjectRepository(CrmAdminAuditLog)
    private readonly crmAdminAuditLogRepository: Repository<CrmAdminAuditLog>,
    @InjectRepository(CrmAutomationAction)
    private readonly crmAutomationActionRepository: Repository<CrmAutomationAction>,
  ) {}

  assertMasterAdmin(usuario: Usuario): void {
    if (usuario.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Acesso restrito ao administrador master');
    }

    const raw = (
      this.configService.get<string>('MASTER_ADMIN_EMAILS') || ''
    ).trim();
    if (!raw) return;

    const allowedEmails = raw
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (!allowedEmails.includes((usuario.email || '').trim().toLowerCase())) {
      throw new ForbiddenException('Acesso restrito ao administrador master');
    }
  }

  private parsePermissionsConfig(): Map<string, Set<CrmAdminPermission>> {
    const raw = (
      this.configService.get<string>('MASTER_ADMIN_PERMISSIONS') || ''
    ).trim();
    if (!raw) return new Map();

    if (this.permissionsCache && this.permissionsCacheRaw === raw) {
      return this.permissionsCache;
    }

    const map = parseCrmAdminPermissionsConfig(raw);
    this.permissionsCacheRaw = raw;
    this.permissionsCache = map;
    return map;
  }

  assertMasterAdminPermission(
    usuario: Usuario,
    permission: CrmAdminPermission,
  ): void {
    this.assertMasterAdmin(usuario);
    const permissionMap = this.parsePermissionsConfig();
    if (permissionMap.size === 0) return;

    const merged = resolveCrmAdminPermissions({
      permissionMap,
      email: usuario.email,
    });

    if (!merged.has(permission)) {
      throw new ForbiddenException(
        'Permissão insuficiente para esta operação administrativa',
      );
    }
  }

  async createAdminAuditLog(params: {
    actorId: string;
    actorEmail: string;
    action: string;
    includeSensitive?: boolean;
    sensitiveReason?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const row = this.crmAdminAuditLogRepository.create({
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      action: params.action,
      includeSensitive: Boolean(params.includeSensitive),
      sensitiveReason: params.sensitiveReason?.trim() || null,
      metadata: params.metadata || null,
    });
    await this.crmAdminAuditLogRepository.save(row);
  }

  async listAdminAuditLogs(params?: {
    q?: string;
    action?: string;
    includeSensitive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Math.floor(params?.page || 1));
    const limit = Math.max(1, Math.min(Math.floor(params?.limit || 20), 100));
    const qb = this.crmAdminAuditLogRepository
      .createQueryBuilder('l')
      .orderBy('l.createdAt', 'DESC');

    const q = (params?.q || '').trim().toLowerCase();
    if (q) {
      qb.andWhere(
        "(LOWER(l.actorEmail) LIKE :q OR LOWER(l.action) LIKE :q OR LOWER(COALESCE(l.sensitiveReason, '')) LIKE :q)",
        { q: `%${q}%` },
      );
    }

    if (params?.action) {
      qb.andWhere('l.action = :action', { action: params.action });
    }
    if (typeof params?.includeSensitive === 'boolean') {
      qb.andWhere('l.includeSensitive = :includeSensitive', {
        includeSensitive: params.includeSensitive,
      });
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getPipelineSummary() {
    const leads = await this.crmLeadRepository.find({ where: { ativo: true } });
    const totalLeads = leads.length;
    const valueByStage = Object.values(CrmLeadStage).reduce(
      (acc, stage) => {
        const stageLeads = leads.filter((lead) => lead.stage === stage);
        acc[stage] = {
          count: stageLeads.length,
          value: stageLeads.reduce(
            (sum, lead) => sum + Number(lead.valorPotencial || 0),
            0,
          ),
        };
        return acc;
      },
      {} as Record<CrmLeadStage, { count: number; value: number }>,
    );

    return {
      totalLeads,
      totalPipelineValue: leads.reduce(
        (sum, lead) => sum + Number(lead.valorPotencial || 0),
        0,
      ),
      byStage: valueByStage,
    };
  }

  async getCommandCenter(params?: {
    windowDays?: number;
    semEvolucaoDias?: number;
    limit?: number;
    professionalId?: string;
    patientId?: string;
  }) {
    const windowDays = Math.max(
      1,
      Math.min(Number(params?.windowDays || 7), 90),
    );
    const semEvolucaoDias = Math.max(
      3,
      Math.min(Number(params?.semEvolucaoDias || 10), 90),
    );
    const limit = Math.max(3, Math.min(Number(params?.limit || 8), 20));
    const now = Date.now();
    const nowDate = new Date(now);
    const staleLeadBefore = new Date(now - 3 * 24 * 60 * 60 * 1000);
    const professionalId =
      String(params?.professionalId || '').trim() || undefined;
    const patientId = String(params?.patientId || '').trim() || undefined;

    const overdueTasksPromise = this.crmTaskRepository
      .createQueryBuilder('task')
      .where('task.ativo = :ativo', { ativo: true })
      .andWhere('task.status = :status', { status: CrmTaskStatus.PENDENTE })
      .andWhere('task.dueAt IS NOT NULL')
      .andWhere('task.dueAt < :now', { now: nowDate })
      .orderBy('task.dueAt', 'ASC')
      .take(50)
      .getMany();

    const staleLeadsPromise = this.crmLeadRepository
      .createQueryBuilder('lead')
      .where('lead.ativo = :ativo', { ativo: true })
      .andWhere('lead.stage IN (:...stages)', {
        stages: [CrmLeadStage.CONTATO, CrmLeadStage.PROPOSTA],
      })
      .andWhere('lead.updatedAt < :staleLeadBefore', { staleLeadBefore })
      .orderBy('lead.updatedAt', 'ASC')
      .take(50)
      .getMany();

    const patientsQb = this.pacienteRepository
      .createQueryBuilder('paciente')
      .leftJoinAndSelect('paciente.usuario', 'profissional')
      .where('paciente.ativo = :ativo', { ativo: true })
      .orderBy('paciente.updatedAt', 'DESC')
      .take(1000);
    if (professionalId) {
      patientsQb.andWhere('paciente.usuarioId = :professionalId', {
        professionalId,
      });
    }
    if (patientId) {
      patientsQb.andWhere('paciente.id = :patientId', { patientId });
    }

    const professionalsQb = this.usuarioRepository
      .createQueryBuilder('usuario')
      .where('usuario.role = :role', { role: UserRole.USER })
      .andWhere('usuario.ativo = :ativo', { ativo: true })
      .orderBy('usuario.updatedAt', 'DESC')
      .take(1000);
    if (professionalId) {
      professionalsQb.andWhere('usuario.id = :professionalId', {
        professionalId,
      });
    }

    const [overdueTasks, staleLeadRows, patients, professionals] =
      await Promise.all([
        overdueTasksPromise,
        staleLeadsPromise,
        patientsQb.getMany(),
        patientId
          ? Promise.resolve([] as Usuario[])
          : professionalsQb.getMany(),
      ]);

    const staleLeadIds = staleLeadRows.map((lead) => lead.id);
    const pendingTasksForStaleLeads = staleLeadIds.length
      ? await this.crmTaskRepository
          .createQueryBuilder('task')
          .select('task.leadId', 'leadId')
          .where('task.ativo = :ativo', { ativo: true })
          .andWhere('task.status = :status', {
            status: CrmTaskStatus.PENDENTE,
          })
          .andWhere('task.leadId IN (:...staleLeadIds)', { staleLeadIds })
          .getRawMany<{ leadId: string }>()
      : [];
    const leadIdsWithPendingTask = new Set(
      pendingTasksForStaleLeads.map((row) => row.leadId),
    );

    const patientIds = patients.map((patient) => patient.id);
    const [
      latestAnamneses,
      latestEvolucoes,
      latestLaudos,
      latestCheckins,
      activeActivityRows,
    ] = patientIds.length
      ? await Promise.all([
          this.anamneseRepository
            .createQueryBuilder('a')
            .where('a.pacienteId IN (:...patientIds)', { patientIds })
            .orderBy('a.pacienteId', 'ASC')
            .addOrderBy('a.createdAt', 'DESC')
            .getMany(),
          this.evolucaoRepository
            .createQueryBuilder('e')
            .where('e.pacienteId IN (:...patientIds)', { patientIds })
            .orderBy('e.pacienteId', 'ASC')
            .addOrderBy('e.data', 'DESC')
            .getMany(),
          this.laudoRepository
            .createQueryBuilder('l')
            .where('l.pacienteId IN (:...patientIds)', { patientIds })
            .orderBy('l.pacienteId', 'ASC')
            .addOrderBy('l.updatedAt', 'DESC')
            .getMany(),
          this.atividadeCheckinRepository
            .createQueryBuilder('c')
            .select('c.pacienteId', 'pacienteId')
            .addSelect('MAX(c.createdAt)', 'lastCheckin')
            .where('c.pacienteId IN (:...patientIds)', { patientIds })
            .groupBy('c.pacienteId')
            .getRawMany<{ pacienteId: string; lastCheckin: string | null }>(),
          this.atividadeRepository
            .createQueryBuilder('a')
            .select('a.pacienteId', 'pacienteId')
            .where('a.ativo = :ativo', { ativo: true })
            .andWhere('a.pacienteId IN (:...patientIds)', { patientIds })
            .groupBy('a.pacienteId')
            .getRawMany<{ pacienteId: string }>(),
        ])
      : [[], [], [], [], []];

    const anamneseByPatient = new Map<string, Anamnese>();
    latestAnamneses.forEach((item) => {
      if (!anamneseByPatient.has(item.pacienteId)) {
        anamneseByPatient.set(item.pacienteId, item);
      }
    });
    const evolucaoByPatient = new Map<string, Evolucao>();
    latestEvolucoes.forEach((item) => {
      if (!evolucaoByPatient.has(item.pacienteId)) {
        evolucaoByPatient.set(item.pacienteId, item);
      }
    });
    const laudoByPatient = new Map<string, Laudo>();
    latestLaudos.forEach((item) => {
      if (!laudoByPatient.has(item.pacienteId)) {
        laudoByPatient.set(item.pacienteId, item);
      }
    });
    const lastCheckinByPatient = new Map<string, string | null>();
    latestCheckins.forEach((row) =>
      lastCheckinByPatient.set(row.pacienteId, row.lastCheckin),
    );
    const activeActivityPatientIds = new Set(
      activeActivityRows.map((row) => row.pacienteId),
    );

    const professionalIds = professionals.map(
      (professional) => professional.id,
    );
    const professionalCountRows = professionalIds.length
      ? await this.pacienteRepository
          .createQueryBuilder('paciente')
          .select('paciente.usuarioId', 'usuarioId')
          .addSelect('COUNT(*)', 'total')
          .addSelect(
            'SUM(CASE WHEN paciente.ativo = true THEN 1 ELSE 0 END)',
            'ativos',
          )
          .addSelect('MAX(paciente.updatedAt)', 'lastPacienteUpdate')
          .where('paciente.usuarioId IN (:...professionalIds)', {
            professionalIds,
          })
          .groupBy('paciente.usuarioId')
          .getRawMany<{
            usuarioId: string;
            total: string;
            ativos: string;
            lastPacienteUpdate: Date | null;
          }>()
      : [];
    const professionalCounts = new Map(
      professionalCountRows.map((row) => [
        row.usuarioId,
        {
          total: Number(row.total || 0),
          ativos: Number(row.ativos || 0),
          lastPacienteUpdate: row.lastPacienteUpdate,
        },
      ]),
    );

    const taskSignals: CrmCommandCenterTaskSignal[] = overdueTasks.map(
      (task) => ({
        id: task.id,
        titulo: task.titulo,
        dueAt: task.dueAt,
        leadId: task.leadId,
        responsavelNome: task.responsavelNome,
      }),
    );
    const leadSignals: CrmCommandCenterLeadSignal[] = staleLeadRows
      .filter((lead) => !leadIdsWithPendingTask.has(lead.id))
      .map((lead) => ({
        id: lead.id,
        nome: lead.nome,
        stage: lead.stage,
        updatedAt: lead.updatedAt,
        responsavelNome: lead.responsavelNome,
      }));
    const patientSignals: CrmCommandCenterPatientSignal[] = patients.map(
      (patient) => {
        const lastLaudo = laudoByPatient.get(patient.id);
        const hasActiveActivity = activeActivityPatientIds.has(patient.id);
        const hasAltaDocumento =
          (lastLaudo?.status === LaudoStatus.VALIDADO_PROFISSIONAL ||
            lastLaudo?.status === LaudoStatus.PUBLICADO_PACIENTE) &&
          !!lastLaudo.criteriosAlta;
        return {
          id: patient.id,
          nomeCompleto: patient.nomeCompleto,
          profissionalNome: patient.usuario?.nome || null,
          createdAt: patient.createdAt,
          hasAnamnese: anamneseByPatient.has(patient.id),
          lastEvolucaoAt: evolucaoByPatient.get(patient.id)?.data || null,
          hasActiveActivity,
          lastCheckinAt: lastCheckinByPatient.get(patient.id) || null,
          tratamentoConcluido: hasAltaDocumento && !hasActiveActivity,
          conviteEnviado:
            patient.vinculoStatus === PacienteVinculoStatus.CONVITE_ENVIADO &&
            !patient.pacienteUsuarioId,
          conviteEnviadoEm: patient.conviteEnviadoEm || null,
        };
      },
    );
    const professionalSignals: CrmCommandCenterProfessionalSignal[] =
      professionals.map((professional) => {
        const counts = professionalCounts.get(professional.id);
        return {
          id: professional.id,
          nome: professional.nome,
          pacientesTotal: counts?.total || 0,
          pacientesAtivos: counts?.ativos || 0,
          lastPacienteUpdate: counts?.lastPacienteUpdate || null,
        };
      });

    return buildCrmCommandCenterSummary({
      now,
      windowDays,
      semEvolucaoDias,
      limit,
      overdueTasks: taskSignals,
      staleLeads: leadSignals,
      patients: patientSignals,
      professionals: professionalSignals,
    });
  }

  private mapAutomationAction(action: CrmAutomationAction) {
    return {
      id: action.id,
      sourceKey: action.sourceKey,
      type: action.type,
      severity: action.severity,
      status: action.status,
      title: action.title,
      description: action.description,
      ctaLabel: action.ctaLabel,
      targetType: action.targetType,
      targetId: action.targetId,
      responsavelUsuarioId: action.responsavelUsuarioId,
      slaDueAt: action.slaDueAt,
      firstSeenAt: action.firstSeenAt,
      lastSeenAt: action.lastSeenAt,
      resolvedAt: action.resolvedAt,
      metadata: action.metadata,
      history: action.history || [],
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
    };
  }

  private appendAutomationHistory(
    action: CrmAutomationAction,
    params: {
      type: CrmAutomationHistoryEventType;
      actorUsuarioId?: string | null;
      fromStatus?: CrmAutomationStatus | null;
      toStatus?: CrmAutomationStatus | null;
      note?: string | null;
      metadata?: Record<string, unknown> | null;
    },
  ) {
    const current = Array.isArray(action.history) ? action.history : [];
    action.history = [
      {
        type: params.type,
        at: new Date().toISOString(),
        actorUsuarioId: params.actorUsuarioId || null,
        fromStatus: params.fromStatus ?? null,
        toStatus: params.toStatus ?? null,
        note: params.note?.trim() || null,
        metadata: params.metadata || null,
      },
      ...current,
    ].slice(0, 50);
  }

  private resolveAutomationSlaDueAt(
    item: CrmCommandCenterItem,
    now = Date.now(),
  ) {
    if (item.type === 'TASK_OVERDUE') return new Date(now);

    const hours =
      item.severity === 'HIGH' ||
      item.type === 'PATIENT_NO_EVOLUTION' ||
      item.type === 'PATIENT_NO_CHECKIN'
        ? 24
        : 72;
    return new Date(now + hours * 60 * 60 * 1000);
  }

  private applyCommandCenterItemToAutomation(
    action: CrmAutomationAction,
    item: CrmCommandCenterItem,
    params?: { actorUsuarioId?: string | null; created?: boolean },
  ) {
    action.sourceKey = item.id;
    action.type = item.type as CrmAutomationActionType;
    action.severity = item.severity as CrmAutomationSeverity;
    action.title = item.title;
    action.description = item.description;
    action.ctaLabel = item.ctaLabel;
    action.targetType = item.targetType as CrmAutomationTargetType;
    action.targetId = item.targetId;
    action.metadata = item.metadata || null;
    action.lastSeenAt = new Date();

    if (!action.firstSeenAt) action.firstSeenAt = new Date();
    if (!action.slaDueAt) {
      action.slaDueAt = this.resolveAutomationSlaDueAt(item);
    }
    if (!action.status) {
      action.status = CrmAutomationStatus.OPEN;
    }
    if (params?.created) {
      this.appendAutomationHistory(action, {
        type: CrmAutomationHistoryEventType.CREATED,
        actorUsuarioId: params.actorUsuarioId,
        toStatus: action.status,
        metadata: {
          sourceKey: item.id,
          slaDueAt: action.slaDueAt?.toISOString() || null,
        },
      });
    } else {
      this.appendAutomationHistory(action, {
        type: CrmAutomationHistoryEventType.SEEN,
        actorUsuarioId: params?.actorUsuarioId,
        toStatus: action.status,
        metadata: { sourceKey: item.id },
      });
    }
  }

  async syncAutomationActions(
    usuario: Usuario,
    params?: {
      windowDays?: number;
      semEvolucaoDias?: number;
      limit?: number;
      professionalId?: string;
      patientId?: string;
    },
  ) {
    const summary = await this.getCommandCenter({
      ...params,
      limit: Math.max(20, Number(params?.limit || 20)),
    });
    const items = summary.nextActions;
    if (!items.length) return { synced: 0, created: 0, refreshed: 0 };

    const existing = await this.crmAutomationActionRepository.find({
      where: items.map((item) => ({ sourceKey: item.id })),
    });
    const existingBySourceKey = new Map(
      existing.map((item) => [item.sourceKey, item]),
    );

    let created = 0;
    let refreshed = 0;
    const rows: CrmAutomationAction[] = [];
    for (const item of items) {
      const current = existingBySourceKey.get(item.id);
      if (current) {
        if (
          current.status === CrmAutomationStatus.DONE ||
          current.status === CrmAutomationStatus.DISMISSED
        ) {
          continue;
        }
        this.applyCommandCenterItemToAutomation(current, item, {
          actorUsuarioId: usuario.id,
        });
        refreshed += 1;
        rows.push(current);
        continue;
      }

      const action = this.crmAutomationActionRepository.create({
        sourceKey: item.id,
        status: CrmAutomationStatus.OPEN,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        resolvedAt: null,
        responsavelUsuarioId: usuario.id,
        history: [],
      });
      this.applyCommandCenterItemToAutomation(action, item, {
        actorUsuarioId: usuario.id,
        created: true,
      });
      created += 1;
      rows.push(action);
    }

    if (rows.length) {
      await this.crmAutomationActionRepository.save(rows);
    }

    return {
      synced: rows.length,
      created,
      refreshed,
    };
  }

  async listAutomationActions(params?: {
    status?: CrmAutomationStatus | 'TODOS' | 'ABERTAS';
    type?: CrmAutomationActionType;
    targetType?: CrmAutomationTargetType;
    targetId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Math.floor(params?.page || 1));
    const limit = Math.max(1, Math.min(Math.floor(params?.limit || 20), 100));
    const qb = this.crmAutomationActionRepository
      .createQueryBuilder('action')
      .orderBy('action.slaDueAt', 'ASC', 'NULLS LAST')
      .addOrderBy('action.severity', 'ASC')
      .addOrderBy('action.updatedAt', 'DESC');

    const status = params?.status || 'ABERTAS';
    if (status === 'ABERTAS') {
      qb.where('action.status IN (:...statuses)', {
        statuses: [
          CrmAutomationStatus.OPEN,
          CrmAutomationStatus.IN_PROGRESS,
          CrmAutomationStatus.SNOOZED,
        ],
      });
    } else if (status !== 'TODOS') {
      qb.where('action.status = :status', { status });
    }

    if (params?.type) {
      qb.andWhere('action.type = :type', { type: params.type });
    }
    if (params?.targetType) {
      qb.andWhere('action.targetType = :targetType', {
        targetType: params.targetType,
      });
    }
    if (params?.targetId) {
      qb.andWhere('action.targetId = :targetId', {
        targetId: params.targetId,
      });
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map((item) => this.mapAutomationAction(item)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async listAutomationActionsWithRefresh(
    usuario: Usuario,
    params?: {
      refresh?: boolean;
      windowDays?: number;
      semEvolucaoDias?: number;
      professionalId?: string;
      patientId?: string;
      status?: CrmAutomationStatus | 'TODOS' | 'ABERTAS';
      type?: CrmAutomationActionType;
      targetType?: CrmAutomationTargetType;
      targetId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const sync = params?.refresh
      ? await this.syncAutomationActions(usuario, params)
      : { synced: 0, created: 0, refreshed: 0 };
    const page = await this.listAutomationActions(params);
    return {
      ...page,
      sync,
    };
  }

  async updateAutomationAction(
    id: string,
    dto: UpdateCrmAutomationActionDto,
    usuario: Usuario,
  ) {
    const action = await this.crmAutomationActionRepository.findOne({
      where: { id },
    });
    if (!action) throw new NotFoundException('Automacao CRM nao encontrada');

    if (dto.status && dto.status !== action.status) {
      const fromStatus = action.status;
      action.status = dto.status;
      action.resolvedAt =
        dto.status === CrmAutomationStatus.DONE ||
        dto.status === CrmAutomationStatus.DISMISSED
          ? new Date()
          : null;
      this.appendAutomationHistory(action, {
        type: CrmAutomationHistoryEventType.STATUS_CHANGED,
        actorUsuarioId: usuario.id,
        fromStatus,
        toStatus: dto.status,
        note: dto.note,
      });
    } else if (dto.note) {
      this.appendAutomationHistory(action, {
        type: CrmAutomationHistoryEventType.NOTE_ADDED,
        actorUsuarioId: usuario.id,
        toStatus: action.status,
        note: dto.note,
      });
    }

    if (dto.slaDueAt) {
      const previousSla = action.slaDueAt?.toISOString() || null;
      action.slaDueAt = new Date(dto.slaDueAt);
      this.appendAutomationHistory(action, {
        type: CrmAutomationHistoryEventType.SLA_CHANGED,
        actorUsuarioId: usuario.id,
        toStatus: action.status,
        note: dto.note,
        metadata: {
          previousSla,
          nextSla: action.slaDueAt.toISOString(),
        },
      });
    }

    return this.mapAutomationAction(
      await this.crmAutomationActionRepository.save(action),
    );
  }

  async listAdminProfissionais(params?: {
    q?: string;
    ativo?: boolean;
    especialidade?: string;
    includeSensitive?: boolean;
  }) {
    const q = (params?.q || '').trim().toLowerCase();
    const especialidade = (params?.especialidade || '').trim().toLowerCase();

    const profissionais = await this.usuarioRepository.find({
      where: { role: UserRole.USER },
      order: { nome: 'ASC' },
    });

    const patientCounts = await this.pacienteRepository
      .createQueryBuilder('paciente')
      .select('paciente.usuarioId', 'usuarioId')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        'SUM(CASE WHEN paciente.ativo = true THEN 1 ELSE 0 END)',
        'ativos',
      )
      .addSelect('MAX(paciente.updatedAt)', 'lastPacienteUpdate')
      .groupBy('paciente.usuarioId')
      .getRawMany<{
        usuarioId: string;
        total: string;
        ativos: string;
        lastPacienteUpdate: Date | null;
      }>();

    const countsMap = new Map(
      patientCounts.map((row) => [
        row.usuarioId,
        {
          total: Number(row.total || 0),
          ativos: Number(row.ativos || 0),
          lastPacienteUpdate: row.lastPacienteUpdate,
        },
      ]),
    );

    return profissionais
      .filter((prof) => {
        if (typeof params?.ativo === 'boolean' && prof.ativo !== params.ativo)
          return false;
        if (
          especialidade &&
          !(prof.especialidade || '').toLowerCase().includes(especialidade)
        ) {
          return false;
        }
        if (!q) return true;
        return (
          prof.nome.toLowerCase().includes(q) ||
          prof.email.toLowerCase().includes(q) ||
          (prof.especialidade || '').toLowerCase().includes(q)
        );
      })
      .map((prof) => {
        const counts = countsMap.get(prof.id);
        return mapCrmAdminProfessional(prof, counts, {
          includeSensitive: params?.includeSensitive,
        });
      });
  }

  async listAdminProfissionaisPaged(params?: {
    q?: string;
    ativo?: boolean;
    especialidade?: string;
    includeSensitive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Math.floor(params?.page || 1));
    const limit = Math.max(1, Math.min(Math.floor(params?.limit || 20), 100));
    const items = await this.listAdminProfissionais(params);
    const total = items.length;
    const data = items.slice((page - 1) * limit, page * limit);
    return {
      items: data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async listAdminPacientes(params?: {
    q?: string;
    ativo?: boolean;
    vinculadoUsuarioPaciente?: boolean;
    cidade?: string;
    uf?: string;
    includeSensitive?: boolean;
  }) {
    const q = (params?.q || '').trim().toLowerCase();
    const cidade = (params?.cidade || '').trim().toLowerCase();
    const uf = (params?.uf || '').trim().toUpperCase();

    const qb = this.pacienteRepository
      .createQueryBuilder('paciente')
      .leftJoinAndSelect('paciente.usuario', 'profissional')
      .leftJoinAndSelect('paciente.pacienteUsuario', 'pacienteUsuario')
      .orderBy('paciente.nomeCompleto', 'ASC');

    if (typeof params?.ativo === 'boolean') {
      qb.andWhere('paciente.ativo = :ativoFilter', {
        ativoFilter: params.ativo,
      });
    }

    if (typeof params?.vinculadoUsuarioPaciente === 'boolean') {
      if (params.vinculadoUsuarioPaciente) {
        qb.andWhere('paciente.pacienteUsuarioId IS NOT NULL');
      } else {
        qb.andWhere('paciente.pacienteUsuarioId IS NULL');
      }
    }

    if (q) {
      qb.andWhere(
        `(LOWER(paciente.nomeCompleto) LIKE :q OR LOWER(COALESCE(paciente.contatoEmail, '')) LIKE :q OR LOWER(COALESCE(profissional.nome, '')) LIKE :q OR LOWER(COALESCE(profissional.email, '')) LIKE :q)`,
        { q: `%${q}%` },
      );
    }

    if (cidade) {
      qb.andWhere(`LOWER(COALESCE(paciente.enderecoCidade, '')) LIKE :cidade`, {
        cidade: `%${cidade}%`,
      });
    }
    if (uf) {
      qb.andWhere(`UPPER(COALESCE(paciente.enderecoUf, '')) = :uf`, { uf });
    }

    const pacientes = await qb.getMany();

    const pacienteIds = pacientes.map((p) => p.id);
    const latestAnamneses = pacienteIds.length
      ? await this.anamneseRepository
          .createQueryBuilder('a')
          .where('a.pacienteId IN (:...pacienteIds)', { pacienteIds })
          .orderBy('a.pacienteId', 'ASC')
          .addOrderBy('a.createdAt', 'DESC')
          .getMany()
      : [];

    const latestAnamneseByPaciente = new Map<string, Anamnese>();
    latestAnamneses.forEach((a) => {
      if (!latestAnamneseByPaciente.has(a.pacienteId)) {
        latestAnamneseByPaciente.set(a.pacienteId, a);
      }
    });

    return pacientes.map((p) =>
      mapCrmAdminPatient(p, latestAnamneseByPaciente.get(p.id), {
        includeSensitive: params?.includeSensitive,
      }),
    );
  }

  async updateAdminProfessional(
    id: string,
    dto: UpdateCrmAdminProfessionalDto,
    params?: { includeSensitive?: boolean },
  ) {
    const profissional = await this.usuarioRepository.findOne({
      where: { id, role: UserRole.USER },
    });
    if (!profissional) {
      throw new NotFoundException('Profissional nao encontrado');
    }

    if (dto.nome !== undefined) {
      profissional.nome = dto.nome.trim();
    }

    if (dto.email !== undefined) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      const existing = await this.usuarioRepository.findOne({
        where: { email: normalizedEmail },
      });
      if (existing && existing.id !== profissional.id) {
        throw new BadRequestException('E-mail ja cadastrado');
      }
      profissional.email = normalizedEmail;
    }

    if (dto.especialidade !== undefined) {
      profissional.especialidade = dto.especialidade.trim() || '';
    }

    if (dto.registroProf !== undefined) {
      profissional.registroProf = dto.registroProf.trim() || '';
    }

    if (dto.ativo !== undefined) {
      profissional.ativo = dto.ativo;
    }

    await this.usuarioRepository.save(profissional);
    const mappedList = await this.listAdminProfissionais({
      includeSensitive: params?.includeSensitive,
      q: profissional.nome,
    });
    return mappedList.find((item) => item.id === profissional.id) ?? null;
  }

  async updateAdminPatient(
    id: string,
    dto: UpdateCrmAdminPatientDto,
    params?: { includeSensitive?: boolean },
  ) {
    const paciente = await this.pacienteRepository.findOne({ where: { id } });
    if (!paciente) {
      throw new NotFoundException('Paciente nao encontrado');
    }

    if (dto.nomeCompleto !== undefined) {
      paciente.nomeCompleto = dto.nomeCompleto.trim();
    }

    if (dto.cpf !== undefined) {
      const cpfDigits = dto.cpf.replace(/\D/g, '');
      const exists = await this.pacienteRepository.findOne({
        where: { usuarioId: paciente.usuarioId, cpf: cpfDigits },
      });
      if (exists && exists.id !== paciente.id) {
        throw new BadRequestException(
          'CPF ja cadastrado para este profissional',
        );
      }
      paciente.cpf = cpfDigits;
    }

    if (dto.dataNascimento !== undefined) {
      paciente.dataNascimento = new Date(dto.dataNascimento);
    }
    if (dto.sexo !== undefined) paciente.sexo = dto.sexo;
    if (dto.estadoCivil !== undefined) paciente.estadoCivil = dto.estadoCivil;
    if (dto.profissao !== undefined)
      paciente.profissao = dto.profissao.trim() || '';
    if (dto.contatoWhatsapp !== undefined) {
      paciente.contatoWhatsapp = dto.contatoWhatsapp.replace(/\D/g, '');
    }
    if (dto.contatoTelefone !== undefined) {
      paciente.contatoTelefone = dto.contatoTelefone
        ? dto.contatoTelefone.replace(/\D/g, '')
        : '';
    }
    if (dto.contatoEmail !== undefined) {
      paciente.contatoEmail = dto.contatoEmail
        ? dto.contatoEmail.trim().toLowerCase()
        : '';
    }
    if (dto.enderecoCidade !== undefined) {
      paciente.enderecoCidade = dto.enderecoCidade.trim() || '';
    }
    if (dto.enderecoUf !== undefined) {
      paciente.enderecoUf = dto.enderecoUf.trim().toUpperCase();
    }
    if (dto.ativo !== undefined) paciente.ativo = dto.ativo;

    await this.pacienteRepository.save(paciente);
    const mappedList = await this.listAdminPacientes({
      includeSensitive: params?.includeSensitive,
      q: paciente.nomeCompleto,
    });
    return mappedList.find((item) => item.id === paciente.id) ?? null;
  }

  async listAdminPacientesPaged(params?: {
    q?: string;
    ativo?: boolean;
    vinculadoUsuarioPaciente?: boolean;
    cidade?: string;
    uf?: string;
    includeSensitive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Math.floor(params?.page || 1));
    const limit = Math.max(1, Math.min(Math.floor(params?.limit || 20), 100));
    const items = await this.listAdminPacientes(params);
    const total = items.length;
    const data = items.slice((page - 1) * limit, page * limit);
    return {
      items: data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  private applyClinicalFlowDashboardFilters(
    qb: SelectQueryBuilder<ClinicalFlowEvent>,
    params: {
      since: Date;
      professionalId?: string;
      patientId?: string;
    },
  ): SelectQueryBuilder<ClinicalFlowEvent> {
    qb.where('e.occurredAt >= :since', { since: params.since });
    if (params.professionalId) {
      qb.andWhere('e.professionalId = :professionalId', {
        professionalId: params.professionalId,
      });
    }
    if (params.patientId) {
      qb.andWhere('e.patientId = :patientId', {
        patientId: params.patientId,
      });
    }
    return qb;
  }

  async getClinicalDashboardSummary(params?: {
    windowDays?: number;
    semEvolucaoDias?: number;
    professionalId?: string;
    patientId?: string;
    status?: string;
  }) {
    const windowDays = Math.max(
      1,
      Math.min(Number(params?.windowDays || 7), 90),
    );
    const semEvolucaoDias = Math.max(
      3,
      Math.min(Number(params?.semEvolucaoDias || 10), 90),
    );
    const now = Date.now();
    const activityWindowMs = windowDays * 24 * 60 * 60 * 1000;
    const since = new Date(now - activityWindowMs);

    const professionalId =
      String(params?.professionalId || '').trim() || undefined;
    const patientId = String(params?.patientId || '').trim() || undefined;
    const statusFilter = String(params?.status || '')
      .trim()
      .toUpperCase();
    const pacientes = await this.pacienteRepository.find({
      where: {
        ativo: true,
        ...(professionalId ? { usuarioId: professionalId } : {}),
        ...(patientId ? { id: patientId } : {}),
      },
    });
    const pacienteIds = pacientes.map((p) => p.id);
    if (!pacienteIds.length) {
      return buildEmptyCrmClinicalDashboardSummary();
    }

    const latestAnamneses = await this.anamneseRepository
      .createQueryBuilder('a')
      .where('a.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .orderBy('a.pacienteId', 'ASC')
      .addOrderBy('a.createdAt', 'DESC')
      .getMany();
    const anamneseByPaciente = new Map<string, Anamnese>();
    latestAnamneses.forEach((item) => {
      if (!anamneseByPaciente.has(item.pacienteId))
        anamneseByPaciente.set(item.pacienteId, item);
    });

    const latestEvolucoes = await this.evolucaoRepository
      .createQueryBuilder('e')
      .where('e.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .orderBy('e.pacienteId', 'ASC')
      .addOrderBy('e.data', 'DESC')
      .getMany();
    const evolucaoByPaciente = new Map<string, Evolucao>();
    latestEvolucoes.forEach((item) => {
      if (!evolucaoByPaciente.has(item.pacienteId))
        evolucaoByPaciente.set(item.pacienteId, item);
    });

    const latestLaudos = await this.laudoRepository
      .createQueryBuilder('l')
      .where('l.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .orderBy('l.pacienteId', 'ASC')
      .addOrderBy('l.updatedAt', 'DESC')
      .getMany();
    const laudoByPaciente = new Map<string, Laudo>();
    latestLaudos.forEach((item) => {
      if (!laudoByPaciente.has(item.pacienteId))
        laudoByPaciente.set(item.pacienteId, item);
    });

    const latestCheckins = await this.atividadeCheckinRepository
      .createQueryBuilder('c')
      .select('c.pacienteId', 'pacienteId')
      .addSelect('MAX(c.createdAt)', 'lastCheckin')
      .where('c.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .groupBy('c.pacienteId')
      .getRawMany<{ pacienteId: string; lastCheckin: string | null }>();
    const checkinByPaciente = new Map<string, string | null>();
    latestCheckins.forEach((row) =>
      checkinByPaciente.set(row.pacienteId, row.lastCheckin),
    );

    const pacientesComAtividade = await this.atividadeRepository
      .createQueryBuilder('a')
      .select('a.pacienteId', 'pacienteId')
      .where('a.ativo = :ativo', { ativo: true })
      .andWhere('a.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .groupBy('a.pacienteId')
      .getRawMany<{ pacienteId: string }>();
    const atividadePacienteIds = new Set(
      pacientesComAtividade.map((row) => row.pacienteId),
    );

    const patientSignals = pacientes.map((paciente) => {
      const hasAnamnese = anamneseByPaciente.has(paciente.id);
      const lastEvolucao = evolucaoByPaciente.get(paciente.id);
      const lastLaudo = laudoByPaciente.get(paciente.id);
      const hasActiveActivity = atividadePacienteIds.has(paciente.id);
      const hasAltaDocumento =
        (lastLaudo?.status === LaudoStatus.VALIDADO_PROFISSIONAL ||
          lastLaudo?.status === LaudoStatus.PUBLICADO_PACIENTE) &&
        !!lastLaudo.criteriosAlta;
      const aguardandoVinculoPaciente =
        !paciente.pacienteUsuarioId ||
        paciente.vinculoStatus === PacienteVinculoStatus.SEM_VINCULO ||
        paciente.vinculoStatus === PacienteVinculoStatus.CONVITE_ENVIADO;

      return {
        id: paciente.id,
        createdAt: paciente.createdAt,
        hasAnamnese,
        lastEvolucaoAt: lastEvolucao?.data || null,
        lastLaudoUpdatedAt: lastLaudo?.updatedAt || null,
        hasAltaDocumento,
        hasActiveActivity,
        lastCheckinAt: checkinByPaciente.get(paciente.id) || null,
        aguardandoVinculo: aguardandoVinculoPaciente,
        conviteEnviado:
          paciente.vinculoStatus === PacienteVinculoStatus.CONVITE_ENVIADO,
      };
    });

    const flowRowsQb = this.clinicalFlowEventRepository
      .createQueryBuilder('e')
      .select('e.stage', 'stage')
      .addSelect('AVG(e.durationMs)', 'avgDuration')
      .addSelect(
        `SUM(CASE WHEN e.eventType = 'STAGE_OPENED' THEN 1 ELSE 0 END)`,
        'opened',
      )
      .addSelect(
        `SUM(CASE WHEN e.eventType = 'STAGE_ABANDONED' THEN 1 ELSE 0 END)`,
        'abandoned',
      )
      .addSelect(
        `SUM(CASE WHEN e.eventType = 'STAGE_COMPLETED' THEN 1 ELSE 0 END)`,
        'completed',
      )
      .addSelect(
        `SUM(CASE WHEN e.eventType = 'STAGE_BLOCKED' THEN 1 ELSE 0 END)`,
        'blocked',
      )
      .addSelect(
        `SUM(CASE WHEN e.eventType = 'STAGE_AUTOSAVED' THEN 1 ELSE 0 END)`,
        'autosaved',
      );

    const flowRows = await this.applyClinicalFlowDashboardFilters(flowRowsQb, {
      since,
      professionalId,
      patientId,
    })
      .groupBy('e.stage')
      .getRawMany<CrmClinicalDashboardFlowRow>();

    const blockedReasonExpression =
      "COALESCE(NULLIF(e.blocked_reason, ''), 'UNKNOWN')";
    const blockedReasonRows = await this.applyClinicalFlowDashboardFilters(
      this.clinicalFlowEventRepository
        .createQueryBuilder('e')
        .select(blockedReasonExpression, 'reason')
        .addSelect('COUNT(*)', 'count'),
      { since, professionalId, patientId },
    )
      .andWhere(`e.eventType = 'STAGE_BLOCKED'`)
      .groupBy(blockedReasonExpression)
      .orderBy('COUNT(*)', 'DESC')
      .limit(5)
      .getRawMany<CrmClinicalDashboardBlockedReasonRow>();

    return buildCrmClinicalDashboardSummary({
      patients: patientSignals,
      flowRows,
      blockedReasonRows,
      now,
      windowDays,
      semEvolucaoDias,
      statusFilter,
      professionalId,
      patientId,
    });
  }

  async listLeads(params?: {
    q?: string;
    stage?: CrmLeadStage | 'TODOS';
    includeSensitive?: boolean;
  }) {
    const leads = await this.buildLeadQuery(params).getMany();
    return leads.map((lead) =>
      mapCrmLead(lead, { includeSensitive: params?.includeSensitive }),
    );
  }

  async listLeadsPaged(params?: {
    q?: string;
    stage?: CrmLeadStage | 'TODOS';
    includeSensitive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Math.floor(params?.page || 1));
    const limit = Math.max(1, Math.min(Math.floor(params?.limit || 20), 100));
    const [items, total] = await this.buildLeadQuery(params)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map((lead) =>
        mapCrmLead(lead, { includeSensitive: params?.includeSensitive }),
      ),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getLeadById(id: string, params?: { includeSensitive?: boolean }) {
    const lead = await this.crmLeadRepository.findOne({
      where: { id, ativo: true },
    });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    return mapCrmLead(lead, { includeSensitive: params?.includeSensitive });
  }

  async createLead(dto: CreateCrmLeadDto, usuario: Usuario) {
    const entity = this.crmLeadRepository.create({
      nome: dto.nome.trim(),
      empresa: dto.empresa?.trim() || null,
      canal: dto.canal,
      stage: dto.stage,
      responsavelNome: dto.responsavelNome?.trim() || usuario.nome,
      responsavelUsuarioId: usuario.id,
      valorPotencial: String(dto.valorPotencial ?? 0),
      observacoes: dto.observacoes?.trim() || null,
      ativo: true,
    });
    return mapCrmLead(await this.crmLeadRepository.save(entity), {
      includeSensitive: true,
    });
  }

  async updateLead(id: string, dto: UpdateCrmLeadDto) {
    const lead = await this.crmLeadRepository.findOne({
      where: { id, ativo: true },
    });
    if (!lead) throw new NotFoundException('Lead não encontrado');

    if (dto.nome !== undefined) lead.nome = dto.nome.trim();
    if (dto.empresa !== undefined) lead.empresa = dto.empresa?.trim() || null;
    if (dto.canal !== undefined) lead.canal = dto.canal;
    if (dto.stage !== undefined) lead.stage = dto.stage;
    if (dto.responsavelNome !== undefined)
      lead.responsavelNome = dto.responsavelNome?.trim() || null;
    if (dto.valorPotencial !== undefined)
      lead.valorPotencial = String(dto.valorPotencial);
    if (dto.observacoes !== undefined)
      lead.observacoes = dto.observacoes?.trim() || null;

    return mapCrmLead(await this.crmLeadRepository.save(lead), {
      includeSensitive: true,
    });
  }

  async deleteLead(id: string): Promise<void> {
    const lead = await this.crmLeadRepository.findOne({
      where: { id, ativo: true },
    });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    lead.ativo = false;
    await this.crmLeadRepository.save(lead);
  }

  async listTasks(params?: {
    status?: CrmTaskStatus | 'TODOS';
    limit?: number;
    includeSensitive?: boolean;
  }) {
    const qb = this.buildTaskQuery(params);
    if (params?.limit) qb.take(Math.max(1, Math.min(params.limit, 100)));
    const tasks = await qb.getMany();
    return tasks.map((task) =>
      mapCrmTask(task, { includeSensitive: params?.includeSensitive }),
    );
  }

  async listTasksPaged(params?: {
    status?: CrmTaskStatus | 'TODOS';
    q?: string;
    leadId?: string;
    includeSensitive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Math.floor(params?.page || 1));
    const limit = Math.max(1, Math.min(Math.floor(params?.limit || 20), 100));
    const [items, total] = await this.buildTaskQuery(params)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      items: items.map((task) =>
        mapCrmTask(task, { includeSensitive: params?.includeSensitive }),
      ),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async createTask(dto: CreateCrmTaskDto, usuario: Usuario) {
    const entity = this.crmTaskRepository.create({
      titulo: dto.titulo.trim(),
      descricao: dto.descricao?.trim() || null,
      leadId: dto.leadId || null,
      responsavelNome: dto.responsavelNome?.trim() || usuario.nome,
      responsavelUsuarioId: usuario.id,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      status: dto.status ?? CrmTaskStatus.PENDENTE,
      ativo: true,
    });
    return mapCrmTask(await this.crmTaskRepository.save(entity), {
      includeSensitive: true,
    });
  }

  async updateTask(id: string, dto: UpdateCrmTaskDto) {
    const task = await this.crmTaskRepository.findOne({
      where: { id, ativo: true },
    });
    if (!task) throw new NotFoundException('Tarefa CRM não encontrada');

    if (dto.titulo !== undefined) task.titulo = dto.titulo.trim();
    if (dto.descricao !== undefined)
      task.descricao = dto.descricao?.trim() || null;
    if (dto.leadId !== undefined) task.leadId = dto.leadId || null;
    if (dto.responsavelNome !== undefined)
      task.responsavelNome = dto.responsavelNome?.trim() || null;
    if (dto.dueAt !== undefined)
      task.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    if (dto.status !== undefined) task.status = dto.status;

    return mapCrmTask(await this.crmTaskRepository.save(task), {
      includeSensitive: true,
    });
  }

  async deleteTask(id: string): Promise<void> {
    const task = await this.crmTaskRepository.findOne({
      where: { id, ativo: true },
    });
    if (!task) throw new NotFoundException('Tarefa CRM não encontrada');
    task.ativo = false;
    await this.crmTaskRepository.save(task);
  }

  async listInteractions(
    leadId: string,
    params?: { includeSensitive?: boolean },
  ) {
    await this.ensureLeadExists(leadId);
    const items = await this.buildInteractionQuery({ leadId }).getMany();
    return items.map((item) =>
      mapCrmInteraction(item, { includeSensitive: params?.includeSensitive }),
    );
  }

  async listInteractionsPaged(params: {
    leadId: string;
    tipo?: string;
    q?: string;
    includeSensitive?: boolean;
    page?: number;
    limit?: number;
  }) {
    await this.ensureLeadExists(params.leadId);
    const page = Math.max(1, Math.floor(params.page || 1));
    const limit = Math.max(1, Math.min(Math.floor(params.limit || 20), 100));
    const [items, total] = await this.buildInteractionQuery(params)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      items: items.map((item) =>
        mapCrmInteraction(item, {
          includeSensitive: params?.includeSensitive,
        }),
      ),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async createInteraction(dto: CreateCrmInteractionDto, usuario: Usuario) {
    await this.ensureLeadExists(dto.leadId);
    const entity = this.crmInteractionRepository.create({
      leadId: dto.leadId,
      tipo: dto.tipo,
      resumo: dto.resumo.trim(),
      detalhes: dto.detalhes?.trim() || null,
      responsavelNome: dto.responsavelNome?.trim() || usuario.nome,
      responsavelUsuarioId: usuario.id,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      ativo: true,
    });
    return mapCrmInteraction(await this.crmInteractionRepository.save(entity), {
      includeSensitive: true,
    });
  }

  async updateInteraction(id: string, dto: UpdateCrmInteractionDto) {
    const item = await this.crmInteractionRepository.findOne({
      where: { id, ativo: true },
    });
    if (!item) throw new NotFoundException('Interação CRM não encontrada');

    if (dto.leadId !== undefined) {
      await this.ensureLeadExists(dto.leadId);
      item.leadId = dto.leadId;
    }
    if (dto.tipo !== undefined) item.tipo = dto.tipo;
    if (dto.resumo !== undefined) item.resumo = dto.resumo.trim();
    if (dto.detalhes !== undefined)
      item.detalhes = dto.detalhes?.trim() || null;
    if (dto.responsavelNome !== undefined)
      item.responsavelNome = dto.responsavelNome?.trim() || null;
    if (dto.occurredAt !== undefined && dto.occurredAt)
      item.occurredAt = new Date(dto.occurredAt);

    return mapCrmInteraction(await this.crmInteractionRepository.save(item), {
      includeSensitive: true,
    });
  }

  async deleteInteraction(id: string): Promise<void> {
    const item = await this.crmInteractionRepository.findOne({
      where: { id, ativo: true },
    });
    if (!item) throw new NotFoundException('Interação CRM não encontrada');
    item.ativo = false;
    await this.crmInteractionRepository.save(item);
  }

  private buildLeadQuery(params?: {
    q?: string;
    stage?: CrmLeadStage | 'TODOS';
  }) {
    const qb = this.crmLeadRepository
      .createQueryBuilder('lead')
      .where('lead.ativo = :ativo', { ativo: true })
      .orderBy('lead.updatedAt', 'DESC');
    if (params?.stage && params.stage !== 'TODOS')
      qb.andWhere('lead.stage = :stage', { stage: params.stage });
    const q = (params?.q || '').trim();
    if (q) {
      qb.andWhere(
        "(LOWER(lead.nome) LIKE :q OR LOWER(COALESCE(lead.empresa, '')) LIKE :q OR LOWER(COALESCE(lead.responsavelNome, '')) LIKE :q)",
        { q: `%${q.toLowerCase()}%` },
      );
    }
    return qb;
  }

  private buildTaskQuery(params?: {
    status?: CrmTaskStatus | 'TODOS';
    q?: string;
    leadId?: string;
  }) {
    const qb = this.crmTaskRepository
      .createQueryBuilder('task')
      .where('task.ativo = :ativo', { ativo: true })
      .orderBy('task.status', 'ASC')
      .addOrderBy('task.dueAt', 'ASC', 'NULLS LAST')
      .addOrderBy('task.updatedAt', 'DESC');
    if (params?.status && params.status !== 'TODOS')
      qb.andWhere('task.status = :status', { status: params.status });
    if (params?.leadId)
      qb.andWhere('task.leadId = :leadId', { leadId: params.leadId });
    const q = (params?.q || '').trim();
    if (q) {
      qb.andWhere(
        "(LOWER(task.titulo) LIKE :q OR LOWER(COALESCE(task.descricao, '')) LIKE :q OR LOWER(COALESCE(task.responsavelNome, '')) LIKE :q)",
        { q: `%${q.toLowerCase()}%` },
      );
    }
    return qb;
  }

  private buildInteractionQuery(params: {
    leadId: string;
    tipo?: string;
    q?: string;
  }): SelectQueryBuilder<CrmInteraction> {
    const qb = this.crmInteractionRepository
      .createQueryBuilder('interaction')
      .where('interaction.ativo = :ativo', { ativo: true })
      .andWhere('interaction.leadId = :leadId', { leadId: params.leadId })
      .orderBy('interaction.occurredAt', 'DESC')
      .addOrderBy('interaction.updatedAt', 'DESC');
    if (params.tipo)
      qb.andWhere('interaction.tipo = :tipo', { tipo: params.tipo });
    const q = (params.q || '').trim();
    if (q) {
      qb.andWhere(
        "(LOWER(interaction.resumo) LIKE :q OR LOWER(COALESCE(interaction.detalhes, '')) LIKE :q OR LOWER(COALESCE(interaction.responsavelNome, '')) LIKE :q)",
        { q: `%${q.toLowerCase()}%` },
      );
    }
    return qb;
  }

  private async ensureLeadExists(id: string): Promise<void> {
    const lead = await this.crmLeadRepository.findOne({
      where: { id, ativo: true },
    });
    if (!lead) throw new NotFoundException('Lead não encontrado');
  }
}
