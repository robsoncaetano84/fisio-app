import { Usuario } from '../usuarios/entities/usuario.entity';
import { CreateClinicalFlowEventDto } from './dto/create-clinical-flow-event.dto';
import { CreatePatientCheckClickDto } from './dto/create-patient-check-click.dto';
import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    trackClinicalFlowEvent(usuario: Usuario, dto: CreateClinicalFlowEventDto): Promise<{
        ok: true;
    }>;
    trackPatientCheckClick(usuario: Usuario, dto: CreatePatientCheckClickDto): Promise<{
        ok: true;
    }>;
    getClinicalFlowSummary(usuario: Usuario, windowDays: number): Promise<{
        windowDays: number;
        opened: number;
        completed: number;
        abandoned: number;
        blocked: number;
        abandonmentRate: number;
        avgDurationMsByStage: Record<import("./entities/clinical-flow-event.entity").ClinicalFlowStage, number>;
        topBlockedReasons: {
            reason: string;
            count: number;
        }[];
        trackedStages: import("./entities/clinical-flow-event.entity").ClinicalFlowStage[];
    }>;
    getPatientCheckEngagementSummary(usuario: Usuario, windowDays: number): Promise<{
        windowDays: number;
        checkClicks: number;
        checkinsSubmitted: number;
        conversionRate: number;
    }>;
    getPhysicalExamTestsSummary(usuario: Usuario, windowDays: number): Promise<{
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
}
