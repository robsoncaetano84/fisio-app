import { Repository } from 'typeorm';
import { AtividadeCheckin } from '../atividades/entities/atividade-checkin.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
import { CreateClinicalFlowEventDto } from './dto/create-clinical-flow-event.dto';
import { CreatePatientCheckClickDto } from './dto/create-patient-check-click.dto';
import { ClinicalFlowEvent, ClinicalFlowStage } from './entities/clinical-flow-event.entity';
import { PatientCheckClickEvent } from './entities/patient-check-click-event.entity';
export declare class MetricsService {
    private readonly clinicalFlowRepo;
    private readonly patientCheckClickRepo;
    private readonly atividadeCheckinRepo;
    private readonly laudoRepo;
    constructor(clinicalFlowRepo: Repository<ClinicalFlowEvent>, patientCheckClickRepo: Repository<PatientCheckClickEvent>, atividadeCheckinRepo: Repository<AtividadeCheckin>, laudoRepo: Repository<Laudo>);
    trackClinicalFlowEvent(professionalId: string, dto: CreateClinicalFlowEventDto): Promise<{
        ok: true;
    }>;
    getClinicalFlowSummary(professionalId: string, windowDays?: number): Promise<{
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
    }>;
    trackPatientCheckClick(professionalId: string, dto: CreatePatientCheckClickDto): Promise<{
        ok: true;
    }>;
    getPatientCheckEngagementSummary(professionalId: string, windowDays?: number): Promise<{
        windowDays: number;
        checkClicks: number;
        checkinsSubmitted: number;
        conversionRate: number;
    }>;
    getPhysicalExamTestsSummary(professionalId: string, windowDays?: number): Promise<{
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
    }>;
    private parseStructuredExame;
}
