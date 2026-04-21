// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// C RM.S ER VI CE
// ==========================================
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
import { CrmLead, CrmLeadStage } from './entities/crm-lead.entity';
import { CrmTask, CrmTaskStatus } from './entities/crm-task.entity';
import { CrmInteraction } from './entities/crm-interaction.entity';
import { ClinicalFlowEvent } from '../metrics/entities/clinical-flow-event.entity';

@Injectable()
export class CrmService {
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
  ) {}

  private maskEmail(email?: string | null): string | null {
    if (!email) return null;
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return '***';
    const head = localPart.slice(0, 2);
    return `${head}***@${domain}`;
  }

  private maskPhone(phone?: string | null): string | null {
    if (!phone) return null;
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length <= 4) return '***';
    return `${digits.slice(0, 2)}******${digits.slice(-2)}`;
  }

  assertMasterAdmin(usuario: Usuario): void {
    if (usuario.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Acesso restrito ao administrador master');
    }

    const raw = (this.configService.get<string>('MASTER_ADMIN_EMAILS') || '').trim();
    if (!raw) return;

    const allowedEmails = raw
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (!allowedEmails.includes((usuario.email || '').trim().toLowerCase())) {
      throw new ForbiddenException('Acesso restrito ao administrador master');
    }
  }

  async getPipelineSummary() {
    const leads = await this.crmLeadRepository.find({ where: { ativo: true } });
    const totalLeads = leads.length;
    const valueByStage = Object.values(CrmLeadStage).reduce(
      (acc, stage) => {
        const stageLeads = leads.filter((lead) => lead.stage === stage);
        acc[stage] = {
          count: stageLeads.length,
          value: stageLeads.reduce((sum, lead) => sum + Number(lead.valorPotencial || 0), 0),
        };
        return acc;
      },
      {} as Record<CrmLeadStage, { count: number; value: number }>,
    );

    return {
      totalLeads,
      totalPipelineValue: leads.reduce((sum, lead) => sum + Number(lead.valorPotencial || 0), 0),
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
      where: { role: UserRole.USER, ativo: true },
      order: { nome: 'ASC' },
    });

    const patientCounts = await this.pacienteRepository
      .createQueryBuilder('paciente')
      .select('paciente.usuarioId', 'usuarioId')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN paciente.ativo = true THEN 1 ELSE 0 END)', 'ativos')
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
        if (typeof params?.ativo === 'boolean' && prof.ativo !== params.ativo) return false;
        if (especialidade && !(prof.especialidade || '').toLowerCase().includes(especialidade)) {
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
        return {
          id: prof.id,
          nome: prof.nome,
          email: params?.includeSensitive ? prof.email : this.maskEmail(prof.email),
          registroProf: prof.registroProf || null,
          especialidade: prof.especialidade || null,
          ativo: prof.ativo,
          role: prof.role,
          createdAt: prof.createdAt,
          updatedAt: prof.updatedAt,
          pacientesTotal: counts?.total || 0,
          pacientesAtivos: counts?.ativos || 0,
          lastPacienteUpdate: counts?.lastPacienteUpdate || null,
        };
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
      .where('paciente.ativo = :ativo', { ativo: true })
      .orderBy('paciente.nomeCompleto', 'ASC');

    if (typeof params?.ativo === 'boolean') {
      qb.andWhere('paciente.ativo = :ativoFilter', { ativoFilter: params.ativo });
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

    return pacientes.map((p) => {
      const lastAnamnese = latestAnamneseByPaciente.get(p.id);
      const emocional = lastAnamnese
        ? {
            nivelEstresse: lastAnamnese.nivelEstresse ?? null,
            energiaDiaria: lastAnamnese.energiaDiaria ?? null,
            apoioEmocional: lastAnamnese.apoioEmocional ?? null,
            qualidadeSono: lastAnamnese.qualidadeSono ?? null,
            humorPredominante: lastAnamnese.humorPredominante || null,
            vulnerabilidade:
              (lastAnamnese.nivelEstresse ?? 0) >= 8 ||
              (typeof lastAnamnese.energiaDiaria === 'number' && lastAnamnese.energiaDiaria <= 3) ||
              (typeof lastAnamnese.apoioEmocional === 'number' && lastAnamnese.apoioEmocional <= 3) ||
              (typeof lastAnamnese.qualidadeSono === 'number' && lastAnamnese.qualidadeSono <= 3),
            updatedAt: lastAnamnese.createdAt,
          }
        : null;

      return {
        id: p.id,
        nomeCompleto: p.nomeCompleto,
        contatoEmail: params?.includeSensitive
          ? p.contatoEmail || null
          : this.maskEmail(p.contatoEmail),
        contatoWhatsapp: params?.includeSensitive
          ? p.contatoWhatsapp || null
          : this.maskPhone(p.contatoWhatsapp),
        enderecoCidade: p.enderecoCidade || null,
        enderecoUf: p.enderecoUf || null,
        profissao: p.profissao || null,
        ativo: p.ativo,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        usuarioId: p.usuarioId,
        profissionalNome: p.usuario?.nome || null,
        profissionalEmail: params?.includeSensitive
          ? p.usuario?.email || null
          : this.maskEmail(p.usuario?.email || null),
        pacienteUsuarioId: p.pacienteUsuarioId,
        pacienteUsuarioEmail: params?.includeSensitive
          ? p.pacienteUsuario?.email || null
          : this.maskEmail(p.pacienteUsuario?.email || null),
        emocional,
      };
    });
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

  async getClinicalDashboardSummary(params?: {
    windowDays?: number;
    semEvolucaoDias?: number;
  }) {
    const windowDays = Math.max(1, Math.min(Number(params?.windowDays || 7), 90));
    const semEvolucaoDias = Math.max(
      3,
      Math.min(Number(params?.semEvolucaoDias || 10), 90),
    );
    const now = Date.now();
    const activityWindowMs = windowDays * 24 * 60 * 60 * 1000;
    const semEvolucaoWindowMs = semEvolucaoDias * 24 * 60 * 60 * 1000;

    const pacientes = await this.pacienteRepository.find({ where: { ativo: true } });
    const pacienteIds = pacientes.map((p) => p.id);
    if (!pacienteIds.length) {
      return {
        pipeline: {
          novoPaciente: 0,
          aguardandoVinculo: 0,
          anamnesePendente: 0,
          emTratamento: 0,
          alta: 0,
        },
        alertas: {
          semCheckin: 0,
          semEvolucao: 0,
          conviteNaoAceito: 0,
          anamnesePendente: 0,
        },
        metricas: {
          abandonoRate: 0,
          conclusaoPlanoRate: 0,
          pacientesEmAtencao: 0,
          tempoMedioPorEtapaMs: {
            ANAMNESE: 0,
            EXAME_FISICO: 0,
            EVOLUCAO: 0,
          },
          blockedTotal: 0,
        },
      };
    }

    const latestAnamneses = await this.anamneseRepository
      .createQueryBuilder('a')
      .where('a.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .orderBy('a.pacienteId', 'ASC')
      .addOrderBy('a.createdAt', 'DESC')
      .getMany();
    const anamneseByPaciente = new Map<string, Anamnese>();
    latestAnamneses.forEach((item) => {
      if (!anamneseByPaciente.has(item.pacienteId)) anamneseByPaciente.set(item.pacienteId, item);
    });

    const latestEvolucoes = await this.evolucaoRepository
      .createQueryBuilder('e')
      .where('e.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .orderBy('e.pacienteId', 'ASC')
      .addOrderBy('e.data', 'DESC')
      .getMany();
    const evolucaoByPaciente = new Map<string, Evolucao>();
    latestEvolucoes.forEach((item) => {
      if (!evolucaoByPaciente.has(item.pacienteId)) evolucaoByPaciente.set(item.pacienteId, item);
    });

    const latestLaudos = await this.laudoRepository
      .createQueryBuilder('l')
      .where('l.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .orderBy('l.pacienteId', 'ASC')
      .addOrderBy('l.updatedAt', 'DESC')
      .getMany();
    const laudoByPaciente = new Map<string, Laudo>();
    latestLaudos.forEach((item) => {
      if (!laudoByPaciente.has(item.pacienteId)) laudoByPaciente.set(item.pacienteId, item);
    });

    const latestCheckins = await this.atividadeCheckinRepository
      .createQueryBuilder('c')
      .select('c.pacienteId', 'pacienteId')
      .addSelect('MAX(c.createdAt)', 'lastCheckin')
      .where('c.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .groupBy('c.pacienteId')
      .getRawMany<{ pacienteId: string; lastCheckin: string | null }>();
    const checkinByPaciente = new Map<string, string | null>();
    latestCheckins.forEach((row) => checkinByPaciente.set(row.pacienteId, row.lastCheckin));

    const pacientesComAtividade = await this.atividadeRepository
      .createQueryBuilder('a')
      .select('a.pacienteId', 'pacienteId')
      .where('a.ativo = :ativo', { ativo: true })
      .andWhere('a.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .groupBy('a.pacienteId')
      .getRawMany<{ pacienteId: string }>();
    const atividadePacienteIds = new Set(pacientesComAtividade.map((row) => row.pacienteId));

    let novoPaciente = 0;
    let aguardandoVinculo = 0;
    let anamnesePendente = 0;
    let emTratamento = 0;
    let alta = 0;
    let semCheckin = 0;
    let semEvolucao = 0;
    let conviteNaoAceito = 0;
    let pacientesEmAtencao = 0;

    for (const paciente of pacientes) {
      const hasAnamnese = anamneseByPaciente.has(paciente.id);
      const lastEvolucao = evolucaoByPaciente.get(paciente.id);
      const lastLaudo = laudoByPaciente.get(paciente.id);
      const createdAtMs = new Date(paciente.createdAt).getTime();
      const lastEvolucaoMs = lastEvolucao?.data
        ? new Date(lastEvolucao.data).getTime()
        : NaN;

      if (!hasAnamnese && now - createdAtMs <= activityWindowMs) {
        novoPaciente += 1;
      }
      if (
        !paciente.pacienteUsuarioId ||
        paciente.vinculoStatus === PacienteVinculoStatus.SEM_VINCULO ||
        paciente.vinculoStatus === PacienteVinculoStatus.CONVITE_ENVIADO
      ) {
        aguardandoVinculo += 1;
      }
      if (!hasAnamnese) {
        anamnesePendente += 1;
      }
      if (
        hasAnamnese &&
        (!lastLaudo ||
          lastLaudo.status !== LaudoStatus.VALIDADO_PROFISSIONAL ||
          !lastLaudo.criteriosAlta)
      ) {
        emTratamento += 1;
      }
      if (
        lastLaudo?.status === LaudoStatus.VALIDADO_PROFISSIONAL &&
        !!lastLaudo.criteriosAlta
      ) {
        alta += 1;
      }

      const lastCheckinRaw = checkinByPaciente.get(paciente.id);
      const lastCheckinMs = lastCheckinRaw ? new Date(lastCheckinRaw).getTime() : NaN;
      if (atividadePacienteIds.has(paciente.id)) {
        if (
          Number.isNaN(lastCheckinMs) ||
          now - lastCheckinMs > activityWindowMs
        ) {
          semCheckin += 1;
        }
      }
      if (Number.isNaN(lastEvolucaoMs) || now - lastEvolucaoMs > semEvolucaoWindowMs) {
        semEvolucao += 1;
        pacientesEmAtencao += 1;
      }
      if (paciente.vinculoStatus === PacienteVinculoStatus.CONVITE_ENVIADO) {
        conviteNaoAceito += 1;
      }
    }

    const flowRows = await this.clinicalFlowEventRepository
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
      .where('e.occurredAt >= :since', {
        since: new Date(now - activityWindowMs),
      })
      .groupBy('e.stage')
      .getRawMany<{
        stage: 'ANAMNESE' | 'EXAME_FISICO' | 'EVOLUCAO';
        avgDuration: string | null;
        opened: string;
        abandoned: string;
        completed: string;
        blocked: string;
      }>();

    const tempoMedioPorEtapaMs = {
      ANAMNESE: 0,
      EXAME_FISICO: 0,
      EVOLUCAO: 0,
    };
    let openedTotal = 0;
    let abandonedTotal = 0;
    let completedTotal = 0;
    let blockedTotal = 0;
    flowRows.forEach((row) => {
      tempoMedioPorEtapaMs[row.stage] = Number(row.avgDuration || 0);
      openedTotal += Number(row.opened || 0);
      abandonedTotal += Number(row.abandoned || 0);
      completedTotal += Number(row.completed || 0);
      blockedTotal += Number(row.blocked || 0);
    });

    const abandonoRate = openedTotal > 0 ? Number(((abandonedTotal / openedTotal) * 100).toFixed(1)) : 0;
    const conclusaoPlanoRate =
      pacienteIds.length > 0 ? Number(((alta / pacienteIds.length) * 100).toFixed(1)) : 0;

    return {
      pipeline: {
        novoPaciente,
        aguardandoVinculo,
        anamnesePendente,
        emTratamento,
        alta,
      },
      alertas: {
        semCheckin,
        semEvolucao,
        conviteNaoAceito,
        anamnesePendente,
      },
      metricas: {
        abandonoRate,
        conclusaoPlanoRate,
        pacientesEmAtencao,
        tempoMedioPorEtapaMs,
        completedTotal,
        blockedTotal,
      },
    };
  }

  async listLeads(params?: { q?: string; stage?: CrmLeadStage | 'TODOS' }) {
    const leads = await this.buildLeadQuery(params).getMany();
    return leads.map((lead) => this.mapLead(lead));
  }

  async listLeadsPaged(params?: {
    q?: string;
    stage?: CrmLeadStage | 'TODOS';
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
      items: items.map((lead) => this.mapLead(lead)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getLeadById(id: string) {
    const lead = await this.crmLeadRepository.findOne({ where: { id, ativo: true } });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    return this.mapLead(lead);
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
    return this.mapLead(await this.crmLeadRepository.save(entity));
  }

  async updateLead(id: string, dto: UpdateCrmLeadDto) {
    const lead = await this.crmLeadRepository.findOne({ where: { id, ativo: true } });
    if (!lead) throw new NotFoundException('Lead não encontrado');

    if (dto.nome !== undefined) lead.nome = dto.nome.trim();
    if (dto.empresa !== undefined) lead.empresa = dto.empresa?.trim() || null;
    if (dto.canal !== undefined) lead.canal = dto.canal;
    if (dto.stage !== undefined) lead.stage = dto.stage;
    if (dto.responsavelNome !== undefined) lead.responsavelNome = dto.responsavelNome?.trim() || null;
    if (dto.valorPotencial !== undefined) lead.valorPotencial = String(dto.valorPotencial);
    if (dto.observacoes !== undefined) lead.observacoes = dto.observacoes?.trim() || null;

    return this.mapLead(await this.crmLeadRepository.save(lead));
  }

  async deleteLead(id: string): Promise<void> {
    const lead = await this.crmLeadRepository.findOne({ where: { id, ativo: true } });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    lead.ativo = false;
    await this.crmLeadRepository.save(lead);
  }

  async listTasks(params?: { status?: CrmTaskStatus | 'TODOS'; limit?: number }) {
    const qb = this.buildTaskQuery(params);
    if (params?.limit) qb.take(Math.max(1, Math.min(params.limit, 100)));
    const tasks = await qb.getMany();
    return tasks.map((task) => this.mapTask(task));
  }

  async listTasksPaged(params?: {
    status?: CrmTaskStatus | 'TODOS';
    q?: string;
    leadId?: string;
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
      items: items.map((task) => this.mapTask(task)),
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
    return this.mapTask(await this.crmTaskRepository.save(entity));
  }

  async updateTask(id: string, dto: UpdateCrmTaskDto) {
    const task = await this.crmTaskRepository.findOne({ where: { id, ativo: true } });
    if (!task) throw new NotFoundException('Tarefa CRM não encontrada');

    if (dto.titulo !== undefined) task.titulo = dto.titulo.trim();
    if (dto.descricao !== undefined) task.descricao = dto.descricao?.trim() || null;
    if (dto.leadId !== undefined) task.leadId = dto.leadId || null;
    if (dto.responsavelNome !== undefined) task.responsavelNome = dto.responsavelNome?.trim() || null;
    if (dto.dueAt !== undefined) task.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    if (dto.status !== undefined) task.status = dto.status;

    return this.mapTask(await this.crmTaskRepository.save(task));
  }

  async deleteTask(id: string): Promise<void> {
    const task = await this.crmTaskRepository.findOne({ where: { id, ativo: true } });
    if (!task) throw new NotFoundException('Tarefa CRM não encontrada');
    task.ativo = false;
    await this.crmTaskRepository.save(task);
  }

  async listInteractions(leadId: string) {
    await this.ensureLeadExists(leadId);
    const items = await this.buildInteractionQuery({ leadId }).getMany();
    return items.map((item) => this.mapInteraction(item));
  }

  async listInteractionsPaged(params: {
    leadId: string;
    tipo?: string;
    q?: string;
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
      items: items.map((item) => this.mapInteraction(item)),
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
    return this.mapInteraction(await this.crmInteractionRepository.save(entity));
  }

  async updateInteraction(id: string, dto: UpdateCrmInteractionDto) {
    const item = await this.crmInteractionRepository.findOne({ where: { id, ativo: true } });
    if (!item) throw new NotFoundException('Interação CRM não encontrada');

    if (dto.leadId !== undefined) {
      await this.ensureLeadExists(dto.leadId);
      item.leadId = dto.leadId;
    }
    if (dto.tipo !== undefined) item.tipo = dto.tipo;
    if (dto.resumo !== undefined) item.resumo = dto.resumo.trim();
    if (dto.detalhes !== undefined) item.detalhes = dto.detalhes?.trim() || null;
    if (dto.responsavelNome !== undefined) item.responsavelNome = dto.responsavelNome?.trim() || null;
    if (dto.occurredAt !== undefined && dto.occurredAt) item.occurredAt = new Date(dto.occurredAt);

    return this.mapInteraction(await this.crmInteractionRepository.save(item));
  }

  async deleteInteraction(id: string): Promise<void> {
    const item = await this.crmInteractionRepository.findOne({ where: { id, ativo: true } });
    if (!item) throw new NotFoundException('Interação CRM não encontrada');
    item.ativo = false;
    await this.crmInteractionRepository.save(item);
  }

  private buildLeadQuery(params?: { q?: string; stage?: CrmLeadStage | 'TODOS' }) {
    const qb = this.crmLeadRepository
      .createQueryBuilder('lead')
      .where('lead.ativo = :ativo', { ativo: true })
      .orderBy('lead.updatedAt', 'DESC');
    if (params?.stage && params.stage !== 'TODOS') qb.andWhere('lead.stage = :stage', { stage: params.stage });
    const q = (params?.q || '').trim();
    if (q) {
      qb.andWhere(
        "(LOWER(lead.nome) LIKE :q OR LOWER(COALESCE(lead.empresa, '')) LIKE :q OR LOWER(COALESCE(lead.responsavelNome, '')) LIKE :q)",
        { q: `%${q.toLowerCase()}%` },
      );
    }
    return qb;
  }

  private buildTaskQuery(params?: { status?: CrmTaskStatus | 'TODOS'; q?: string; leadId?: string }) {
    const qb = this.crmTaskRepository
      .createQueryBuilder('task')
      .where('task.ativo = :ativo', { ativo: true })
      .orderBy('task.status', 'ASC')
      .addOrderBy('task.dueAt', 'ASC', 'NULLS LAST')
      .addOrderBy('task.updatedAt', 'DESC');
    if (params?.status && params.status !== 'TODOS') qb.andWhere('task.status = :status', { status: params.status });
    if (params?.leadId) qb.andWhere('task.leadId = :leadId', { leadId: params.leadId });
    const q = (params?.q || '').trim();
    if (q) {
      qb.andWhere(
        "(LOWER(task.titulo) LIKE :q OR LOWER(COALESCE(task.descricao, '')) LIKE :q OR LOWER(COALESCE(task.responsavelNome, '')) LIKE :q)",
        { q: `%${q.toLowerCase()}%` },
      );
    }
    return qb;
  }

  private buildInteractionQuery(params: { leadId: string; tipo?: string; q?: string }): SelectQueryBuilder<CrmInteraction> {
    const qb = this.crmInteractionRepository
      .createQueryBuilder('interaction')
      .where('interaction.ativo = :ativo', { ativo: true })
      .andWhere('interaction.leadId = :leadId', { leadId: params.leadId })
      .orderBy('interaction.occurredAt', 'DESC')
      .addOrderBy('interaction.updatedAt', 'DESC');
    if (params.tipo) qb.andWhere('interaction.tipo = :tipo', { tipo: params.tipo });
    const q = (params.q || '').trim();
    if (q) {
      qb.andWhere(
        "(LOWER(interaction.resumo) LIKE :q OR LOWER(COALESCE(interaction.detalhes, '')) LIKE :q OR LOWER(COALESCE(interaction.responsavelNome, '')) LIKE :q)",
        { q: `%${q.toLowerCase()}%` },
      );
    }
    return qb;
  }

  private mapLead(lead: CrmLead) {
    return {
      id: lead.id,
      nome: lead.nome,
      empresa: lead.empresa,
      canal: lead.canal,
      stage: lead.stage,
      responsavelNome: lead.responsavelNome,
      responsavelUsuarioId: lead.responsavelUsuarioId,
      valorPotencial: Number(lead.valorPotencial || 0),
      observacoes: lead.observacoes,
      ativo: lead.ativo,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  }

  private mapTask(task: CrmTask) {
    return {
      id: task.id,
      titulo: task.titulo,
      descricao: task.descricao,
      leadId: task.leadId,
      responsavelNome: task.responsavelNome,
      responsavelUsuarioId: task.responsavelUsuarioId,
      dueAt: task.dueAt,
      status: task.status,
      ativo: task.ativo,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  private mapInteraction(item: CrmInteraction) {
    return {
      id: item.id,
      leadId: item.leadId,
      tipo: item.tipo,
      resumo: item.resumo,
      detalhes: item.detalhes,
      responsavelNome: item.responsavelNome,
      responsavelUsuarioId: item.responsavelUsuarioId,
      occurredAt: item.occurredAt,
      ativo: item.ativo,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private async ensureLeadExists(id: string): Promise<void> {
    const lead = await this.crmLeadRepository.findOne({ where: { id, ativo: true } });
    if (!lead) throw new NotFoundException('Lead não encontrado');
  }
}
