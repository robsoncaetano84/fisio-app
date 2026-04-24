import { Repository } from 'typeorm';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Atividade } from '../atividades/entities/atividade.entity';
import { AtividadeCheckin } from '../atividades/entities/atividade-checkin.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { UserRole } from '../usuarios/entities/usuario.entity';
import { CreateClinicalFlowEventDto } from './dto/create-clinical-flow-event.dto';
import { CreatePatientCheckClickDto } from './dto/create-patient-check-click.dto';
import { ClinicalFlowEvent, ClinicalFlowEventType, ClinicalFlowStage } from './entities/clinical-flow-event.entity';
import { PatientCheckClickEvent } from './entities/patient-check-click-event.entity';
type MetricsSummaryFilters = {
    professionalId?: string;
    patientId?: string;
    stage?: string;
    status?: string;
};
export declare class MetricsService {
    private readonly clinicalFlowRepo;
    private readonly patientCheckClickRepo;
    private readonly atividadeCheckinRepo;
    private readonly laudoRepo;
    private readonly pacienteRepo;
    private readonly anamneseRepo;
    private readonly atividadeRepo;
    constructor(clinicalFlowRepo: Repository<ClinicalFlowEvent>, patientCheckClickRepo: Repository<PatientCheckClickEvent>, atividadeCheckinRepo: Repository<AtividadeCheckin>, laudoRepo: Repository<Laudo>, pacienteRepo: Repository<Paciente>, anamneseRepo: Repository<Anamnese>, atividadeRepo: Repository<Atividade>);
    trackClinicalFlowEvent(professionalId: string, dto: CreateClinicalFlowEventDto): Promise<{
        ok: true;
    }>;
    getClinicalFlowSummary(actorId: string, actorRole: UserRole, windowDays?: number, filters?: MetricsSummaryFilters): Promise<{
        windowDays: number;
        opened: number;
        completed: number;
        abandoned: number;
        blocked: number;
        abandonmentRate: number;
        avgDurationMsByStage: Record<ClinicalFlowStage, number>;
        topBlockedReasons: {
            reason: string;
            count: number;
        }[];
        trackedStages: ClinicalFlowStage[];
        filters: {
            professionalId: string | null;
            patientId: string | null;
            stage: ClinicalFlowStage | null;
            status: ClinicalFlowEventType | null;
        };
    }>;
    trackPatientCheckClick(professionalId: string, dto: CreatePatientCheckClickDto): Promise<{
        ok: true;
    }>;
    getPatientCheckEngagementSummary(actorId: string, actorRole: UserRole, windowDays?: number, filters?: Pick<MetricsSummaryFilters, 'professionalId' | 'patientId' | 'status'>): Promise<{
        windowDays: number;
        checkClicks: number;
        checkinsSubmitted: number;
        conversionRate: number;
        filters: {
            professionalId: string | null;
            patientId: string | null;
            status: string | null;
        };
    }>;
    getPhysicalExamTestsSummary(actorId: string, actorRole: UserRole, windowDays?: number, filters?: Pick<MetricsSummaryFilters, 'professionalId' | 'patientId' | 'status'>): Promise<{
        windowDays: number;
        laudosAnalisados: number;
        laudosComExameEstruturado: number;
        totalAvaliados: number;
        totalPositivos: number;
        taxaPositividadeGeral: number;
        porRegiao: {
            taxaPositividade: number;
            regiao: string;
            titulo: string;
            positivos: number;
            avaliados: number;
        }[];
        topTestesPositivos: {
            teste: string;
            count: number;
        }[];
        perfisScoring: {
            perfil: string;
            count: number;
        }[];
        filters: {
            professionalId: string | null;
            patientId: string | null;
            status: string | null;
        };
    }>;
    private resolveScopedProfessionalId;
    private resolveScopedPatientIds;
    private parseStructuredExame;
}
export {};
