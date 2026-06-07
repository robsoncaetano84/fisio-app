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
import { CrmLead, CrmLeadStage } from './entities/crm-lead.entity';
import { CrmTask, CrmTaskStatus } from './entities/crm-task.entity';
import { CrmInteraction } from './entities/crm-interaction.entity';
import { ClinicalFlowEvent } from '../metrics/entities/clinical-flow-event.entity';
import { CrmAdminAuditLog } from './entities/crm-admin-audit-log.entity';
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
