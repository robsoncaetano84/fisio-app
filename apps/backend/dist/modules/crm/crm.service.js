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
exports.CrmService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const paciente_entity_1 = require("../pacientes/entities/paciente.entity");
const paciente_entity_2 = require("../pacientes/entities/paciente.entity");
const anamnese_entity_1 = require("../anamneses/entities/anamnese.entity");
const evolucao_entity_1 = require("../evolucoes/entities/evolucao.entity");
const atividade_entity_1 = require("../atividades/entities/atividade.entity");
const atividade_checkin_entity_1 = require("../atividades/entities/atividade-checkin.entity");
const laudo_entity_1 = require("../laudos/entities/laudo.entity");
const crm_lead_entity_1 = require("./entities/crm-lead.entity");
const crm_task_entity_1 = require("./entities/crm-task.entity");
const crm_interaction_entity_1 = require("./entities/crm-interaction.entity");
const clinical_flow_event_entity_1 = require("../metrics/entities/clinical-flow-event.entity");
const crm_admin_audit_log_entity_1 = require("./entities/crm-admin-audit-log.entity");
let CrmService = class CrmService {
    configService;
    crmLeadRepository;
    crmTaskRepository;
    crmInteractionRepository;
    pacienteRepository;
    usuarioRepository;
    anamneseRepository;
    evolucaoRepository;
    atividadeRepository;
    atividadeCheckinRepository;
    laudoRepository;
    clinicalFlowEventRepository;
    crmAdminAuditLogRepository;
    permissionsCacheRaw = null;
    permissionsCache = null;
    constructor(configService, crmLeadRepository, crmTaskRepository, crmInteractionRepository, pacienteRepository, usuarioRepository, anamneseRepository, evolucaoRepository, atividadeRepository, atividadeCheckinRepository, laudoRepository, clinicalFlowEventRepository, crmAdminAuditLogRepository) {
        this.configService = configService;
        this.crmLeadRepository = crmLeadRepository;
        this.crmTaskRepository = crmTaskRepository;
        this.crmInteractionRepository = crmInteractionRepository;
        this.pacienteRepository = pacienteRepository;
        this.usuarioRepository = usuarioRepository;
        this.anamneseRepository = anamneseRepository;
        this.evolucaoRepository = evolucaoRepository;
        this.atividadeRepository = atividadeRepository;
        this.atividadeCheckinRepository = atividadeCheckinRepository;
        this.laudoRepository = laudoRepository;
        this.clinicalFlowEventRepository = clinicalFlowEventRepository;
        this.crmAdminAuditLogRepository = crmAdminAuditLogRepository;
    }
    maskEmail(email) {
        if (!email)
            return null;
        const [localPart, domain] = email.split('@');
        if (!localPart || !domain)
            return '***';
        const head = localPart.slice(0, 2);
        return `${head}***@${domain}`;
    }
    maskPhone(phone) {
        if (!phone)
            return null;
        const digits = String(phone).replace(/\D/g, '');
        if (digits.length <= 4)
            return '***';
        return `${digits.slice(0, 2)}******${digits.slice(-2)}`;
    }
    maskRichText(value, includeSensitive) {
        if (!value)
            return null;
        return includeSensitive ? value : '[mascarado]';
    }
    assertMasterAdmin(usuario) {
        if (usuario.role !== usuario_entity_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Acesso restrito ao administrador master');
        }
        const raw = (this.configService.get('MASTER_ADMIN_EMAILS') || '').trim();
        if (!raw)
            return;
        const allowedEmails = raw
            .split(',')
            .map((item) => item.trim().toLowerCase())
            .filter(Boolean);
        if (!allowedEmails.includes((usuario.email || '').trim().toLowerCase())) {
            throw new common_1.ForbiddenException('Acesso restrito ao administrador master');
        }
    }
    parsePermissionsConfig() {
        const raw = (this.configService.get('MASTER_ADMIN_PERMISSIONS') || '').trim();
        if (!raw)
            return new Map();
        if (this.permissionsCache && this.permissionsCacheRaw === raw) {
            return this.permissionsCache;
        }
        const allowed = new Set([
            'dashboard.read',
            'crm.read',
            'crm.write',
            'audit.read',
            'sensitive.read',
        ]);
        const map = new Map();
        try {
            const parsed = JSON.parse(raw);
            for (const [emailKey, permissionsRaw] of Object.entries(parsed || {})) {
                const email = emailKey.trim().toLowerCase();
                if (!email)
                    continue;
                const permissions = Array.isArray(permissionsRaw)
                    ? permissionsRaw
                    : typeof permissionsRaw === 'string'
                        ? String(permissionsRaw).split('|')
                        : [];
                const normalized = new Set();
                permissions.forEach((item) => {
                    const permission = String(item).trim();
                    if (allowed.has(permission))
                        normalized.add(permission);
                });
                if (normalized.size > 0)
                    map.set(email, normalized);
            }
        }
        catch {
            const pairs = raw
                .split(';')
                .map((chunk) => chunk.trim())
                .filter(Boolean);
            pairs.forEach((pair) => {
                const [emailRaw, permissionsRaw] = pair.split('=');
                const email = (emailRaw || '').trim().toLowerCase();
                if (!email)
                    return;
                const normalized = new Set();
                (permissionsRaw || '')
                    .split('|')
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .forEach((item) => {
                    const permission = item;
                    if (allowed.has(permission))
                        normalized.add(permission);
                });
                if (normalized.size > 0)
                    map.set(email, normalized);
            });
        }
        this.permissionsCacheRaw = raw;
        this.permissionsCache = map;
        return map;
    }
    assertMasterAdminPermission(usuario, permission) {
        this.assertMasterAdmin(usuario);
        const permissionMap = this.parsePermissionsConfig();
        if (permissionMap.size === 0)
            return;
        const email = (usuario.email || '').trim().toLowerCase();
        const direct = permissionMap.get(email);
        const wildcard = permissionMap.get('*');
        const merged = new Set([...(wildcard || []), ...(direct || [])]);
        if (!merged.has(permission)) {
            throw new common_1.ForbiddenException('Permissão insuficiente para esta operação administrativa');
        }
    }
    async createAdminAuditLog(params) {
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
    async listAdminAuditLogs(params) {
        const page = Math.max(1, Math.floor(params?.page || 1));
        const limit = Math.max(1, Math.min(Math.floor(params?.limit || 20), 100));
        const qb = this.crmAdminAuditLogRepository
            .createQueryBuilder('l')
            .orderBy('l.createdAt', 'DESC');
        const q = (params?.q || '').trim().toLowerCase();
        if (q) {
            qb.andWhere('(LOWER(l.actorEmail) LIKE :q OR LOWER(l.action) LIKE :q OR LOWER(COALESCE(l.sensitiveReason, \'\')) LIKE :q)', { q: `%${q}%` });
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
        const valueByStage = Object.values(crm_lead_entity_1.CrmLeadStage).reduce((acc, stage) => {
            const stageLeads = leads.filter((lead) => lead.stage === stage);
            acc[stage] = {
                count: stageLeads.length,
                value: stageLeads.reduce((sum, lead) => sum + Number(lead.valorPotencial || 0), 0),
            };
            return acc;
        }, {});
        return {
            totalLeads,
            totalPipelineValue: leads.reduce((sum, lead) => sum + Number(lead.valorPotencial || 0), 0),
            byStage: valueByStage,
        };
    }
    async listAdminProfissionais(params) {
        const q = (params?.q || '').trim().toLowerCase();
        const especialidade = (params?.especialidade || '').trim().toLowerCase();
        const profissionais = await this.usuarioRepository.find({
            where: { role: usuario_entity_1.UserRole.USER },
            order: { nome: 'ASC' },
        });
        const patientCounts = await this.pacienteRepository
            .createQueryBuilder('paciente')
            .select('paciente.usuarioId', 'usuarioId')
            .addSelect('COUNT(*)', 'total')
            .addSelect('SUM(CASE WHEN paciente.ativo = true THEN 1 ELSE 0 END)', 'ativos')
            .addSelect('MAX(paciente.updatedAt)', 'lastPacienteUpdate')
            .groupBy('paciente.usuarioId')
            .getRawMany();
        const countsMap = new Map(patientCounts.map((row) => [
            row.usuarioId,
            {
                total: Number(row.total || 0),
                ativos: Number(row.ativos || 0),
                lastPacienteUpdate: row.lastPacienteUpdate,
            },
        ]));
        return profissionais
            .filter((prof) => {
            if (typeof params?.ativo === 'boolean' && prof.ativo !== params.ativo)
                return false;
            if (especialidade && !(prof.especialidade || '').toLowerCase().includes(especialidade)) {
                return false;
            }
            if (!q)
                return true;
            return (prof.nome.toLowerCase().includes(q) ||
                prof.email.toLowerCase().includes(q) ||
                (prof.especialidade || '').toLowerCase().includes(q));
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
    async listAdminProfissionaisPaged(params) {
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
    async listAdminPacientes(params) {
        const q = (params?.q || '').trim().toLowerCase();
        const cidade = (params?.cidade || '').trim().toLowerCase();
        const uf = (params?.uf || '').trim().toUpperCase();
        const qb = this.pacienteRepository
            .createQueryBuilder('paciente')
            .leftJoinAndSelect('paciente.usuario', 'profissional')
            .leftJoinAndSelect('paciente.pacienteUsuario', 'pacienteUsuario')
            .orderBy('paciente.nomeCompleto', 'ASC');
        if (typeof params?.ativo === 'boolean') {
            qb.andWhere('paciente.ativo = :ativoFilter', { ativoFilter: params.ativo });
        }
        if (typeof params?.vinculadoUsuarioPaciente === 'boolean') {
            if (params.vinculadoUsuarioPaciente) {
                qb.andWhere('paciente.pacienteUsuarioId IS NOT NULL');
            }
            else {
                qb.andWhere('paciente.pacienteUsuarioId IS NULL');
            }
        }
        if (q) {
            qb.andWhere(`(LOWER(paciente.nomeCompleto) LIKE :q OR LOWER(COALESCE(paciente.contatoEmail, '')) LIKE :q OR LOWER(COALESCE(profissional.nome, '')) LIKE :q OR LOWER(COALESCE(profissional.email, '')) LIKE :q)`, { q: `%${q}%` });
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
        const latestAnamneseByPaciente = new Map();
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
                    vulnerabilidade: (lastAnamnese.nivelEstresse ?? 0) >= 8 ||
                        (typeof lastAnamnese.energiaDiaria === 'number' && lastAnamnese.energiaDiaria <= 3) ||
                        (typeof lastAnamnese.apoioEmocional === 'number' && lastAnamnese.apoioEmocional <= 3) ||
                        (typeof lastAnamnese.qualidadeSono === 'number' && lastAnamnese.qualidadeSono <= 3),
                    updatedAt: lastAnamnese.createdAt,
                }
                : null;
            return {
                id: p.id,
                nomeCompleto: p.nomeCompleto,
                cpf: params?.includeSensitive ? p.cpf : this.maskPhone(p.cpf),
                dataNascimento: p.dataNascimento,
                sexo: p.sexo,
                estadoCivil: p.estadoCivil || null,
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
    async updateAdminProfessional(id, dto, params) {
        const profissional = await this.usuarioRepository.findOne({
            where: { id, role: usuario_entity_1.UserRole.USER },
        });
        if (!profissional) {
            throw new common_1.NotFoundException('Profissional nao encontrado');
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
                throw new common_1.BadRequestException('E-mail ja cadastrado');
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
    async updateAdminPatient(id, dto, params) {
        const paciente = await this.pacienteRepository.findOne({ where: { id } });
        if (!paciente) {
            throw new common_1.NotFoundException('Paciente nao encontrado');
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
                throw new common_1.BadRequestException('CPF ja cadastrado para este profissional');
            }
            paciente.cpf = cpfDigits;
        }
        if (dto.dataNascimento !== undefined) {
            paciente.dataNascimento = new Date(dto.dataNascimento);
        }
        if (dto.sexo !== undefined)
            paciente.sexo = dto.sexo;
        if (dto.estadoCivil !== undefined)
            paciente.estadoCivil = dto.estadoCivil;
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
            paciente.contatoEmail = dto.contatoEmail ? dto.contatoEmail.trim().toLowerCase() : '';
        }
        if (dto.enderecoCidade !== undefined) {
            paciente.enderecoCidade = dto.enderecoCidade.trim() || '';
        }
        if (dto.enderecoUf !== undefined) {
            paciente.enderecoUf = dto.enderecoUf.trim().toUpperCase();
        }
        if (dto.ativo !== undefined)
            paciente.ativo = dto.ativo;
        await this.pacienteRepository.save(paciente);
        const mappedList = await this.listAdminPacientes({
            includeSensitive: params?.includeSensitive,
            q: paciente.nomeCompleto,
        });
        return mappedList.find((item) => item.id === paciente.id) ?? null;
    }
    async listAdminPacientesPaged(params) {
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
    async getClinicalDashboardSummary(params) {
        const windowDays = Math.max(1, Math.min(Number(params?.windowDays || 7), 90));
        const semEvolucaoDias = Math.max(3, Math.min(Number(params?.semEvolucaoDias || 10), 90));
        const now = Date.now();
        const activityWindowMs = windowDays * 24 * 60 * 60 * 1000;
        const semEvolucaoWindowMs = semEvolucaoDias * 24 * 60 * 60 * 1000;
        const inactiveClosedWindowMs = 30 * 24 * 60 * 60 * 1000;
        const professionalId = String(params?.professionalId || '').trim() || undefined;
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
        const anamneseByPaciente = new Map();
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
        const evolucaoByPaciente = new Map();
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
        const laudoByPaciente = new Map();
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
            .getRawMany();
        const checkinByPaciente = new Map();
        latestCheckins.forEach((row) => checkinByPaciente.set(row.pacienteId, row.lastCheckin));
        const pacientesComAtividade = await this.atividadeRepository
            .createQueryBuilder('a')
            .select('a.pacienteId', 'pacienteId')
            .where('a.ativo = :ativo', { ativo: true })
            .andWhere('a.pacienteId IN (:...pacienteIds)', { pacienteIds })
            .groupBy('a.pacienteId')
            .getRawMany();
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
            const lastLaudoUpdatedMs = lastLaudo?.updatedAt
                ? new Date(lastLaudo.updatedAt).getTime()
                : NaN;
            const hasActiveActivity = atividadePacienteIds.has(paciente.id);
            const hasAltaDocumento = lastLaudo?.status === laudo_entity_1.LaudoStatus.VALIDADO_PROFISSIONAL &&
                !!lastLaudo.criteriosAlta;
            const tratamentoConcluido = hasAltaDocumento && !hasActiveActivity;
            const aguardandoVinculoPaciente = !paciente.pacienteUsuarioId ||
                paciente.vinculoStatus === paciente_entity_2.PacienteVinculoStatus.SEM_VINCULO ||
                paciente.vinculoStatus === paciente_entity_2.PacienteVinculoStatus.CONVITE_ENVIADO;
            if (statusFilter && statusFilter !== 'ALL' && statusFilter !== 'TODOS') {
                const matchesStatus = (statusFilter === 'NOVO_PACIENTE' &&
                    !hasAnamnese &&
                    now - createdAtMs <= activityWindowMs) ||
                    (statusFilter === 'AGUARDANDO_VINCULO' && aguardandoVinculoPaciente) ||
                    (statusFilter === 'ANAMNESE_PENDENTE' && !hasAnamnese) ||
                    (statusFilter === 'EM_TRATAMENTO' &&
                        hasAnamnese &&
                        !tratamentoConcluido) ||
                    (statusFilter === 'ALTA' && tratamentoConcluido);
                if (!matchesStatus) {
                    continue;
                }
            }
            if (!hasAnamnese && now - createdAtMs <= activityWindowMs) {
                novoPaciente += 1;
            }
            if (aguardandoVinculoPaciente) {
                aguardandoVinculo += 1;
            }
            if (!hasAnamnese) {
                anamnesePendente += 1;
            }
            if (hasAnamnese && !tratamentoConcluido) {
                emTratamento += 1;
            }
            if (tratamentoConcluido) {
                alta += 1;
            }
            const lastCheckinRaw = checkinByPaciente.get(paciente.id);
            const lastCheckinMs = lastCheckinRaw ? new Date(lastCheckinRaw).getTime() : NaN;
            const lastClinicalEventMs = Math.max(Number.isNaN(lastCheckinMs) ? -1 : lastCheckinMs, Number.isNaN(lastEvolucaoMs) ? -1 : lastEvolucaoMs, Number.isNaN(lastLaudoUpdatedMs) ? -1 : lastLaudoUpdatedMs);
            const inativoEncerrado = tratamentoConcluido &&
                lastClinicalEventMs > 0 &&
                now - lastClinicalEventMs > inactiveClosedWindowMs;
            if (tratamentoConcluido || inativoEncerrado) {
                continue;
            }
            if (hasActiveActivity) {
                if (Number.isNaN(lastCheckinMs) ||
                    now - lastCheckinMs > activityWindowMs) {
                    semCheckin += 1;
                }
            }
            if (Number.isNaN(lastEvolucaoMs) || now - lastEvolucaoMs > semEvolucaoWindowMs) {
                semEvolucao += 1;
                pacientesEmAtencao += 1;
            }
            if (paciente.vinculoStatus === paciente_entity_2.PacienteVinculoStatus.CONVITE_ENVIADO) {
                conviteNaoAceito += 1;
            }
        }
        const flowRows = await this.clinicalFlowEventRepository
            .createQueryBuilder('e')
            .select('e.stage', 'stage')
            .addSelect('AVG(e.durationMs)', 'avgDuration')
            .addSelect(`SUM(CASE WHEN e.eventType = 'STAGE_OPENED' THEN 1 ELSE 0 END)`, 'opened')
            .addSelect(`SUM(CASE WHEN e.eventType = 'STAGE_ABANDONED' THEN 1 ELSE 0 END)`, 'abandoned')
            .addSelect(`SUM(CASE WHEN e.eventType = 'STAGE_COMPLETED' THEN 1 ELSE 0 END)`, 'completed')
            .addSelect(`SUM(CASE WHEN e.eventType = 'STAGE_BLOCKED' THEN 1 ELSE 0 END)`, 'blocked')
            .where('e.occurredAt >= :since', {
            since: new Date(now - activityWindowMs),
        })
            .andWhere(professionalId ? 'e.professionalId = :professionalId' : '1=1', professionalId ? { professionalId } : {})
            .andWhere(patientId ? 'e.patientId = :patientId' : '1=1', patientId ? { patientId } : {})
            .groupBy('e.stage')
            .getRawMany();
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
        const conclusaoPlanoRate = pacienteIds.length > 0 ? Number(((alta / pacienteIds.length) * 100).toFixed(1)) : 0;
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
            filtros: {
                professionalId: professionalId || null,
                patientId: patientId || null,
                status: statusFilter || null,
            },
        };
    }
    async listLeads(params) {
        const leads = await this.buildLeadQuery(params).getMany();
        return leads.map((lead) => this.mapLead(lead, { includeSensitive: params?.includeSensitive }));
    }
    async listLeadsPaged(params) {
        const page = Math.max(1, Math.floor(params?.page || 1));
        const limit = Math.max(1, Math.min(Math.floor(params?.limit || 20), 100));
        const [items, total] = await this.buildLeadQuery(params)
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return {
            items: items.map((lead) => this.mapLead(lead, { includeSensitive: params?.includeSensitive })),
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        };
    }
    async getLeadById(id, params) {
        const lead = await this.crmLeadRepository.findOne({ where: { id, ativo: true } });
        if (!lead)
            throw new common_1.NotFoundException('Lead não encontrado');
        return this.mapLead(lead, { includeSensitive: params?.includeSensitive });
    }
    async createLead(dto, usuario) {
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
        return this.mapLead(await this.crmLeadRepository.save(entity), {
            includeSensitive: true,
        });
    }
    async updateLead(id, dto) {
        const lead = await this.crmLeadRepository.findOne({ where: { id, ativo: true } });
        if (!lead)
            throw new common_1.NotFoundException('Lead não encontrado');
        if (dto.nome !== undefined)
            lead.nome = dto.nome.trim();
        if (dto.empresa !== undefined)
            lead.empresa = dto.empresa?.trim() || null;
        if (dto.canal !== undefined)
            lead.canal = dto.canal;
        if (dto.stage !== undefined)
            lead.stage = dto.stage;
        if (dto.responsavelNome !== undefined)
            lead.responsavelNome = dto.responsavelNome?.trim() || null;
        if (dto.valorPotencial !== undefined)
            lead.valorPotencial = String(dto.valorPotencial);
        if (dto.observacoes !== undefined)
            lead.observacoes = dto.observacoes?.trim() || null;
        return this.mapLead(await this.crmLeadRepository.save(lead), {
            includeSensitive: true,
        });
    }
    async deleteLead(id) {
        const lead = await this.crmLeadRepository.findOne({ where: { id, ativo: true } });
        if (!lead)
            throw new common_1.NotFoundException('Lead não encontrado');
        lead.ativo = false;
        await this.crmLeadRepository.save(lead);
    }
    async listTasks(params) {
        const qb = this.buildTaskQuery(params);
        if (params?.limit)
            qb.take(Math.max(1, Math.min(params.limit, 100)));
        const tasks = await qb.getMany();
        return tasks.map((task) => this.mapTask(task, { includeSensitive: params?.includeSensitive }));
    }
    async listTasksPaged(params) {
        const page = Math.max(1, Math.floor(params?.page || 1));
        const limit = Math.max(1, Math.min(Math.floor(params?.limit || 20), 100));
        const [items, total] = await this.buildTaskQuery(params)
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return {
            items: items.map((task) => this.mapTask(task, { includeSensitive: params?.includeSensitive })),
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        };
    }
    async createTask(dto, usuario) {
        const entity = this.crmTaskRepository.create({
            titulo: dto.titulo.trim(),
            descricao: dto.descricao?.trim() || null,
            leadId: dto.leadId || null,
            responsavelNome: dto.responsavelNome?.trim() || usuario.nome,
            responsavelUsuarioId: usuario.id,
            dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
            status: dto.status ?? crm_task_entity_1.CrmTaskStatus.PENDENTE,
            ativo: true,
        });
        return this.mapTask(await this.crmTaskRepository.save(entity), {
            includeSensitive: true,
        });
    }
    async updateTask(id, dto) {
        const task = await this.crmTaskRepository.findOne({ where: { id, ativo: true } });
        if (!task)
            throw new common_1.NotFoundException('Tarefa CRM não encontrada');
        if (dto.titulo !== undefined)
            task.titulo = dto.titulo.trim();
        if (dto.descricao !== undefined)
            task.descricao = dto.descricao?.trim() || null;
        if (dto.leadId !== undefined)
            task.leadId = dto.leadId || null;
        if (dto.responsavelNome !== undefined)
            task.responsavelNome = dto.responsavelNome?.trim() || null;
        if (dto.dueAt !== undefined)
            task.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
        if (dto.status !== undefined)
            task.status = dto.status;
        return this.mapTask(await this.crmTaskRepository.save(task), {
            includeSensitive: true,
        });
    }
    async deleteTask(id) {
        const task = await this.crmTaskRepository.findOne({ where: { id, ativo: true } });
        if (!task)
            throw new common_1.NotFoundException('Tarefa CRM não encontrada');
        task.ativo = false;
        await this.crmTaskRepository.save(task);
    }
    async listInteractions(leadId, params) {
        await this.ensureLeadExists(leadId);
        const items = await this.buildInteractionQuery({ leadId }).getMany();
        return items.map((item) => this.mapInteraction(item, { includeSensitive: params?.includeSensitive }));
    }
    async listInteractionsPaged(params) {
        await this.ensureLeadExists(params.leadId);
        const page = Math.max(1, Math.floor(params.page || 1));
        const limit = Math.max(1, Math.min(Math.floor(params.limit || 20), 100));
        const [items, total] = await this.buildInteractionQuery(params)
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return {
            items: items.map((item) => this.mapInteraction(item, { includeSensitive: params?.includeSensitive })),
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        };
    }
    async createInteraction(dto, usuario) {
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
        return this.mapInteraction(await this.crmInteractionRepository.save(entity), {
            includeSensitive: true,
        });
    }
    async updateInteraction(id, dto) {
        const item = await this.crmInteractionRepository.findOne({ where: { id, ativo: true } });
        if (!item)
            throw new common_1.NotFoundException('Interação CRM não encontrada');
        if (dto.leadId !== undefined) {
            await this.ensureLeadExists(dto.leadId);
            item.leadId = dto.leadId;
        }
        if (dto.tipo !== undefined)
            item.tipo = dto.tipo;
        if (dto.resumo !== undefined)
            item.resumo = dto.resumo.trim();
        if (dto.detalhes !== undefined)
            item.detalhes = dto.detalhes?.trim() || null;
        if (dto.responsavelNome !== undefined)
            item.responsavelNome = dto.responsavelNome?.trim() || null;
        if (dto.occurredAt !== undefined && dto.occurredAt)
            item.occurredAt = new Date(dto.occurredAt);
        return this.mapInteraction(await this.crmInteractionRepository.save(item), {
            includeSensitive: true,
        });
    }
    async deleteInteraction(id) {
        const item = await this.crmInteractionRepository.findOne({ where: { id, ativo: true } });
        if (!item)
            throw new common_1.NotFoundException('Interação CRM não encontrada');
        item.ativo = false;
        await this.crmInteractionRepository.save(item);
    }
    buildLeadQuery(params) {
        const qb = this.crmLeadRepository
            .createQueryBuilder('lead')
            .where('lead.ativo = :ativo', { ativo: true })
            .orderBy('lead.updatedAt', 'DESC');
        if (params?.stage && params.stage !== 'TODOS')
            qb.andWhere('lead.stage = :stage', { stage: params.stage });
        const q = (params?.q || '').trim();
        if (q) {
            qb.andWhere("(LOWER(lead.nome) LIKE :q OR LOWER(COALESCE(lead.empresa, '')) LIKE :q OR LOWER(COALESCE(lead.responsavelNome, '')) LIKE :q)", { q: `%${q.toLowerCase()}%` });
        }
        return qb;
    }
    buildTaskQuery(params) {
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
            qb.andWhere("(LOWER(task.titulo) LIKE :q OR LOWER(COALESCE(task.descricao, '')) LIKE :q OR LOWER(COALESCE(task.responsavelNome, '')) LIKE :q)", { q: `%${q.toLowerCase()}%` });
        }
        return qb;
    }
    buildInteractionQuery(params) {
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
            qb.andWhere("(LOWER(interaction.resumo) LIKE :q OR LOWER(COALESCE(interaction.detalhes, '')) LIKE :q OR LOWER(COALESCE(interaction.responsavelNome, '')) LIKE :q)", { q: `%${q.toLowerCase()}%` });
        }
        return qb;
    }
    mapLead(lead, params) {
        return {
            id: lead.id,
            nome: lead.nome,
            empresa: lead.empresa,
            canal: lead.canal,
            stage: lead.stage,
            responsavelNome: lead.responsavelNome,
            responsavelUsuarioId: lead.responsavelUsuarioId,
            valorPotencial: Number(lead.valorPotencial || 0),
            observacoes: this.maskRichText(lead.observacoes, params?.includeSensitive),
            ativo: lead.ativo,
            createdAt: lead.createdAt,
            updatedAt: lead.updatedAt,
        };
    }
    mapTask(task, params) {
        return {
            id: task.id,
            titulo: task.titulo,
            descricao: this.maskRichText(task.descricao, params?.includeSensitive),
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
    mapInteraction(item, params) {
        return {
            id: item.id,
            leadId: item.leadId,
            tipo: item.tipo,
            resumo: item.resumo,
            detalhes: this.maskRichText(item.detalhes, params?.includeSensitive),
            responsavelNome: item.responsavelNome,
            responsavelUsuarioId: item.responsavelUsuarioId,
            occurredAt: item.occurredAt,
            ativo: item.ativo,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        };
    }
    async ensureLeadExists(id) {
        const lead = await this.crmLeadRepository.findOne({ where: { id, ativo: true } });
        if (!lead)
            throw new common_1.NotFoundException('Lead não encontrado');
    }
};
exports.CrmService = CrmService;
exports.CrmService = CrmService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(crm_lead_entity_1.CrmLead)),
    __param(2, (0, typeorm_1.InjectRepository)(crm_task_entity_1.CrmTask)),
    __param(3, (0, typeorm_1.InjectRepository)(crm_interaction_entity_1.CrmInteraction)),
    __param(4, (0, typeorm_1.InjectRepository)(paciente_entity_1.Paciente)),
    __param(5, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __param(6, (0, typeorm_1.InjectRepository)(anamnese_entity_1.Anamnese)),
    __param(7, (0, typeorm_1.InjectRepository)(evolucao_entity_1.Evolucao)),
    __param(8, (0, typeorm_1.InjectRepository)(atividade_entity_1.Atividade)),
    __param(9, (0, typeorm_1.InjectRepository)(atividade_checkin_entity_1.AtividadeCheckin)),
    __param(10, (0, typeorm_1.InjectRepository)(laudo_entity_1.Laudo)),
    __param(11, (0, typeorm_1.InjectRepository)(clinical_flow_event_entity_1.ClinicalFlowEvent)),
    __param(12, (0, typeorm_1.InjectRepository)(crm_admin_audit_log_entity_1.CrmAdminAuditLog)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CrmService);
//# sourceMappingURL=crm.service.js.map