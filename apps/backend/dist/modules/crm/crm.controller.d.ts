import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { CrmService } from './crm.service';
import { CreateCrmLeadDto } from './dto/create-crm-lead.dto';
import { UpdateCrmLeadDto } from './dto/update-crm-lead.dto';
import { CreateCrmTaskDto } from './dto/create-crm-task.dto';
import { UpdateCrmTaskDto } from './dto/update-crm-task.dto';
import { CreateCrmInteractionDto } from './dto/create-crm-interaction.dto';
import { UpdateCrmInteractionDto } from './dto/update-crm-interaction.dto';
import { UpdateCrmAdminProfessionalDto } from './dto/update-crm-admin-professional.dto';
import { UpdateCrmAdminPatientDto } from './dto/update-crm-admin-patient.dto';
import { CrmLeadStage } from './entities/crm-lead.entity';
import { CrmTaskStatus } from './entities/crm-task.entity';
export declare class CrmController {
    private readonly crmService;
    private readonly logger;
    constructor(crmService: CrmService);
    private requirePermission;
    private runAudited;
    private auditAdminAccess;
    getPipelineSummary(usuario: Usuario): Promise<{
        totalLeads: number;
        totalPipelineValue: number;
        byStage: Record<CrmLeadStage, {
            count: number;
            value: number;
        }>;
    }>;
    getClinicalDashboardSummary(usuario: Usuario, windowDays?: string, semEvolucaoDias?: string, professionalId?: string, patientId?: string, status?: string): Promise<{
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
        filtros?: undefined;
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
        filtros: {
            professionalId: string | null;
            patientId: string | null;
            status: string | null;
        };
    }>;
    listAdminProfissionais(usuario: Usuario, q?: string, ativo?: string, especialidade?: string, includeSensitive?: string, sensitiveReason?: string): Promise<{
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
    listAdminProfissionaisPaged(usuario: Usuario, q?: string, ativo?: string, especialidade?: string, includeSensitive?: string, sensitiveReason?: string, page?: string, limit?: string): Promise<{
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
    listAdminPacientes(usuario: Usuario, q?: string, ativo?: string, vinculadoUsuarioPaciente?: string, cidade?: string, uf?: string, includeSensitive?: string, sensitiveReason?: string): Promise<{
        id: string;
        nomeCompleto: string;
        cpf: string | null;
        dataNascimento: Date;
        sexo: import("../pacientes/entities/paciente.entity").Sexo;
        estadoCivil: import("../pacientes/entities/paciente.entity").EstadoCivil;
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
    listAdminPacientesPaged(usuario: Usuario, q?: string, ativo?: string, vinculadoUsuarioPaciente?: string, cidade?: string, uf?: string, includeSensitive?: string, sensitiveReason?: string, page?: string, limit?: string): Promise<{
        items: {
            id: string;
            nomeCompleto: string;
            cpf: string | null;
            dataNascimento: Date;
            sexo: import("../pacientes/entities/paciente.entity").Sexo;
            estadoCivil: import("../pacientes/entities/paciente.entity").EstadoCivil;
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
    updateAdminProfissional(usuario: Usuario, id: string, dto: UpdateCrmAdminProfessionalDto, includeSensitive?: string, sensitiveReason?: string): Promise<{
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
    } | null>;
    updateAdminPaciente(usuario: Usuario, id: string, dto: UpdateCrmAdminPatientDto, includeSensitive?: string, sensitiveReason?: string): Promise<{
        id: string;
        nomeCompleto: string;
        cpf: string | null;
        dataNascimento: Date;
        sexo: import("../pacientes/entities/paciente.entity").Sexo;
        estadoCivil: import("../pacientes/entities/paciente.entity").EstadoCivil;
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
    } | null>;
    listLeads(usuario: Usuario, q?: string, stage?: CrmLeadStage | 'TODOS', includeSensitive?: string, sensitiveReason?: string): Promise<{
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
    listAdminAuditLogs(usuario: Usuario, q?: string, action?: string, includeSensitive?: string, page?: string, limit?: string): Promise<{
        items: import("./entities/crm-admin-audit-log.entity").CrmAdminAuditLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    listLeadsPaged(usuario: Usuario, q?: string, stage?: CrmLeadStage | 'TODOS', includeSensitive?: string, sensitiveReason?: string, page?: string, limit?: string): Promise<{
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
    getLeadById(usuario: Usuario, id: string, includeSensitive?: string, sensitiveReason?: string): Promise<{
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
    createLead(usuario: Usuario, dto: CreateCrmLeadDto): Promise<{
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
    updateLead(usuario: Usuario, id: string, dto: UpdateCrmLeadDto): Promise<{
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
    deleteLead(usuario: Usuario, id: string): Promise<{
        success: boolean;
    }>;
    listTasks(usuario: Usuario, status?: CrmTaskStatus | 'TODOS', includeSensitive?: string, sensitiveReason?: string, limit?: string): Promise<{
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
    listTasksPaged(usuario: Usuario, status?: CrmTaskStatus | 'TODOS', leadId?: string, q?: string, includeSensitive?: string, sensitiveReason?: string, page?: string, limit?: string): Promise<{
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
    createTask(usuario: Usuario, dto: CreateCrmTaskDto): Promise<{
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
    updateTask(usuario: Usuario, id: string, dto: UpdateCrmTaskDto): Promise<{
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
    deleteTask(usuario: Usuario, id: string): Promise<{
        success: boolean;
    }>;
    listInteractions(usuario: Usuario, leadId: string, includeSensitive?: string, sensitiveReason?: string): Promise<{
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
    listInteractionsPaged(usuario: Usuario, leadId: string, tipo?: string, q?: string, includeSensitive?: string, sensitiveReason?: string, page?: string, limit?: string): Promise<{
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
    createInteraction(usuario: Usuario, dto: CreateCrmInteractionDto): Promise<{
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
    updateInteraction(usuario: Usuario, id: string, dto: UpdateCrmInteractionDto): Promise<{
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
    deleteInteraction(usuario: Usuario, id: string): Promise<{
        success: boolean;
    }>;
    private validateSensitiveReason;
}
