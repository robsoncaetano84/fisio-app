import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Atividade } from '../atividades/entities/atividade.entity';
import { AtividadeCheckin } from '../atividades/entities/atividade-checkin.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
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
import { CrmAdminAuditLog } from './entities/crm-admin-audit-log.entity';
export type CrmAdminPermission = 'dashboard.read' | 'crm.read' | 'crm.write' | 'audit.read' | 'sensitive.read';
export declare class CrmService {
    private readonly configService;
    private readonly crmLeadRepository;
    private readonly crmTaskRepository;
    private readonly crmInteractionRepository;
    private readonly pacienteRepository;
    private readonly usuarioRepository;
    private readonly anamneseRepository;
    private readonly evolucaoRepository;
    private readonly atividadeRepository;
    private readonly atividadeCheckinRepository;
    private readonly laudoRepository;
    private readonly clinicalFlowEventRepository;
    private readonly crmAdminAuditLogRepository;
    private permissionsCacheRaw;
    private permissionsCache;
    constructor(configService: ConfigService, crmLeadRepository: Repository<CrmLead>, crmTaskRepository: Repository<CrmTask>, crmInteractionRepository: Repository<CrmInteraction>, pacienteRepository: Repository<Paciente>, usuarioRepository: Repository<Usuario>, anamneseRepository: Repository<Anamnese>, evolucaoRepository: Repository<Evolucao>, atividadeRepository: Repository<Atividade>, atividadeCheckinRepository: Repository<AtividadeCheckin>, laudoRepository: Repository<Laudo>, clinicalFlowEventRepository: Repository<ClinicalFlowEvent>, crmAdminAuditLogRepository: Repository<CrmAdminAuditLog>);
    private maskEmail;
    private maskPhone;
    private maskRichText;
    assertMasterAdmin(usuario: Usuario): void;
    private parsePermissionsConfig;
    assertMasterAdminPermission(usuario: Usuario, permission: CrmAdminPermission): void;
    createAdminAuditLog(params: {
        actorId: string;
        actorEmail: string;
        action: string;
        includeSensitive?: boolean;
        sensitiveReason?: string;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    listAdminAuditLogs(params?: {
        q?: string;
        action?: string;
        includeSensitive?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        items: CrmAdminAuditLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPipelineSummary(): Promise<{
        totalLeads: number;
        totalPipelineValue: number;
        byStage: Record<CrmLeadStage, {
            count: number;
            value: number;
        }>;
    }>;
    listAdminProfissionais(params?: {
        q?: string;
        ativo?: boolean;
        especialidade?: string;
        includeSensitive?: boolean;
    }): Promise<{
        id: string;
        nome: string;
        email: string | null;
        registroProf: string | null;
        especialidade: string | null;
        ativo: boolean;
        role: UserRole;
        createdAt: Date;
        updatedAt: Date;
        pacientesTotal: number;
        pacientesAtivos: number;
        lastPacienteUpdate: Date | null;
    }[]>;
    listAdminProfissionaisPaged(params?: {
        q?: string;
        ativo?: boolean;
        especialidade?: string;
        includeSensitive?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        items: {
            id: string;
            nome: string;
            email: string | null;
            registroProf: string | null;
            especialidade: string | null;
            ativo: boolean;
            role: UserRole;
            createdAt: Date;
            updatedAt: Date;
            pacientesTotal: number;
            pacientesAtivos: number;
            lastPacienteUpdate: Date | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    listAdminPacientes(params?: {
        q?: string;
        ativo?: boolean;
        vinculadoUsuarioPaciente?: boolean;
        cidade?: string;
        uf?: string;
        includeSensitive?: boolean;
    }): Promise<{
        id: string;
        nomeCompleto: string;
        contatoEmail: string | null;
        contatoWhatsapp: string | null;
        enderecoCidade: string | null;
        enderecoUf: string | null;
        profissao: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        usuarioId: string;
        profissionalNome: string | null;
        profissionalEmail: string | null;
        pacienteUsuarioId: string | null;
        pacienteUsuarioEmail: string | null;
        emocional: {
            nivelEstresse: number;
            energiaDiaria: number;
            apoioEmocional: number;
            qualidadeSono: number;
            humorPredominante: string | null;
            vulnerabilidade: boolean;
            updatedAt: Date;
        } | null;
    }[]>;
    listAdminPacientesPaged(params?: {
        q?: string;
        ativo?: boolean;
        vinculadoUsuarioPaciente?: boolean;
        cidade?: string;
        uf?: string;
        includeSensitive?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        items: {
            id: string;
            nomeCompleto: string;
            contatoEmail: string | null;
            contatoWhatsapp: string | null;
            enderecoCidade: string | null;
            enderecoUf: string | null;
            profissao: string | null;
            ativo: boolean;
            createdAt: Date;
            updatedAt: Date;
            usuarioId: string;
            profissionalNome: string | null;
            profissionalEmail: string | null;
            pacienteUsuarioId: string | null;
            pacienteUsuarioEmail: string | null;
            emocional: {
                nivelEstresse: number;
                energiaDiaria: number;
                apoioEmocional: number;
                qualidadeSono: number;
                humorPredominante: string | null;
                vulnerabilidade: boolean;
                updatedAt: Date;
            } | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getClinicalDashboardSummary(params?: {
        windowDays?: number;
        semEvolucaoDias?: number;
    }): Promise<{
        pipeline: {
            novoPaciente: number;
            aguardandoVinculo: number;
            anamnesePendente: number;
            emTratamento: number;
            alta: number;
        };
        alertas: {
            semCheckin: number;
            semEvolucao: number;
            conviteNaoAceito: number;
            anamnesePendente: number;
        };
        metricas: {
            abandonoRate: number;
            conclusaoPlanoRate: number;
            pacientesEmAtencao: number;
            tempoMedioPorEtapaMs: {
                ANAMNESE: number;
                EXAME_FISICO: number;
                EVOLUCAO: number;
            };
            blockedTotal: number;
            completedTotal?: undefined;
        };
    } | {
        pipeline: {
            novoPaciente: number;
            aguardandoVinculo: number;
            anamnesePendente: number;
            emTratamento: number;
            alta: number;
        };
        alertas: {
            semCheckin: number;
            semEvolucao: number;
            conviteNaoAceito: number;
            anamnesePendente: number;
        };
        metricas: {
            abandonoRate: number;
            conclusaoPlanoRate: number;
            pacientesEmAtencao: number;
            tempoMedioPorEtapaMs: {
                ANAMNESE: number;
                EXAME_FISICO: number;
                EVOLUCAO: number;
            };
            completedTotal: number;
            blockedTotal: number;
        };
    }>;
    listLeads(params?: {
        q?: string;
        stage?: CrmLeadStage | 'TODOS';
        includeSensitive?: boolean;
    }): Promise<{
        id: string;
        nome: string;
        empresa: string | null;
        canal: import("./entities/crm-lead.entity").CrmLeadChannel;
        stage: CrmLeadStage;
        responsavelNome: string | null;
        responsavelUsuarioId: string | null;
        valorPotencial: number;
        observacoes: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    listLeadsPaged(params?: {
        q?: string;
        stage?: CrmLeadStage | 'TODOS';
        includeSensitive?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        items: {
            id: string;
            nome: string;
            empresa: string | null;
            canal: import("./entities/crm-lead.entity").CrmLeadChannel;
            stage: CrmLeadStage;
            responsavelNome: string | null;
            responsavelUsuarioId: string | null;
            valorPotencial: number;
            observacoes: string | null;
            ativo: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getLeadById(id: string, params?: {
        includeSensitive?: boolean;
    }): Promise<{
        id: string;
        nome: string;
        empresa: string | null;
        canal: import("./entities/crm-lead.entity").CrmLeadChannel;
        stage: CrmLeadStage;
        responsavelNome: string | null;
        responsavelUsuarioId: string | null;
        valorPotencial: number;
        observacoes: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createLead(dto: CreateCrmLeadDto, usuario: Usuario): Promise<{
        id: string;
        nome: string;
        empresa: string | null;
        canal: import("./entities/crm-lead.entity").CrmLeadChannel;
        stage: CrmLeadStage;
        responsavelNome: string | null;
        responsavelUsuarioId: string | null;
        valorPotencial: number;
        observacoes: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateLead(id: string, dto: UpdateCrmLeadDto): Promise<{
        id: string;
        nome: string;
        empresa: string | null;
        canal: import("./entities/crm-lead.entity").CrmLeadChannel;
        stage: CrmLeadStage;
        responsavelNome: string | null;
        responsavelUsuarioId: string | null;
        valorPotencial: number;
        observacoes: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteLead(id: string): Promise<void>;
    listTasks(params?: {
        status?: CrmTaskStatus | 'TODOS';
        limit?: number;
        includeSensitive?: boolean;
    }): Promise<{
        id: string;
        titulo: string;
        descricao: string | null;
        leadId: string | null;
        responsavelNome: string | null;
        responsavelUsuarioId: string | null;
        dueAt: Date | null;
        status: CrmTaskStatus;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    listTasksPaged(params?: {
        status?: CrmTaskStatus | 'TODOS';
        q?: string;
        leadId?: string;
        includeSensitive?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        items: {
            id: string;
            titulo: string;
            descricao: string | null;
            leadId: string | null;
            responsavelNome: string | null;
            responsavelUsuarioId: string | null;
            dueAt: Date | null;
            status: CrmTaskStatus;
            ativo: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createTask(dto: CreateCrmTaskDto, usuario: Usuario): Promise<{
        id: string;
        titulo: string;
        descricao: string | null;
        leadId: string | null;
        responsavelNome: string | null;
        responsavelUsuarioId: string | null;
        dueAt: Date | null;
        status: CrmTaskStatus;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateTask(id: string, dto: UpdateCrmTaskDto): Promise<{
        id: string;
        titulo: string;
        descricao: string | null;
        leadId: string | null;
        responsavelNome: string | null;
        responsavelUsuarioId: string | null;
        dueAt: Date | null;
        status: CrmTaskStatus;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteTask(id: string): Promise<void>;
    listInteractions(leadId: string, params?: {
        includeSensitive?: boolean;
    }): Promise<{
        id: string;
        leadId: string;
        tipo: import("./entities/crm-interaction.entity").CrmInteractionType;
        resumo: string;
        detalhes: string | null;
        responsavelNome: string | null;
        responsavelUsuarioId: string | null;
        occurredAt: Date;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    listInteractionsPaged(params: {
        leadId: string;
        tipo?: string;
        q?: string;
        includeSensitive?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        items: {
            id: string;
            leadId: string;
            tipo: import("./entities/crm-interaction.entity").CrmInteractionType;
            resumo: string;
            detalhes: string | null;
            responsavelNome: string | null;
            responsavelUsuarioId: string | null;
            occurredAt: Date;
            ativo: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createInteraction(dto: CreateCrmInteractionDto, usuario: Usuario): Promise<{
        id: string;
        leadId: string;
        tipo: import("./entities/crm-interaction.entity").CrmInteractionType;
        resumo: string;
        detalhes: string | null;
        responsavelNome: string | null;
        responsavelUsuarioId: string | null;
        occurredAt: Date;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateInteraction(id: string, dto: UpdateCrmInteractionDto): Promise<{
        id: string;
        leadId: string;
        tipo: import("./entities/crm-interaction.entity").CrmInteractionType;
        resumo: string;
        detalhes: string | null;
        responsavelNome: string | null;
        responsavelUsuarioId: string | null;
        occurredAt: Date;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteInteraction(id: string): Promise<void>;
    private buildLeadQuery;
    private buildTaskQuery;
    private buildInteractionQuery;
    private mapLead;
    private mapTask;
    private mapInteraction;
    private ensureLeadExists;
}
