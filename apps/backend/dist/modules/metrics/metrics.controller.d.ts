import { Usuario } from '../usuarios/entities/usuario.entity';
import { CreateClinicalFlowEventDto } from './dto/create-clinical-flow-event.dto';
import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    trackClinicalFlowEvent(usuario: Usuario, dto: CreateClinicalFlowEventDto): Promise<{
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
}
