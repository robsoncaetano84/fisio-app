import { Repository } from 'typeorm';
import { CreateClinicalFlowEventDto } from './dto/create-clinical-flow-event.dto';
import { ClinicalFlowEvent, ClinicalFlowStage } from './entities/clinical-flow-event.entity';
export declare class MetricsService {
    private readonly clinicalFlowRepo;
    constructor(clinicalFlowRepo: Repository<ClinicalFlowEvent>);
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
}
