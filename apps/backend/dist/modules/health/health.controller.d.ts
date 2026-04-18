import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    getHealth(): Promise<{
        status: string;
        service: string;
        version: string | null;
        environment: string;
        timestamp: string;
        uptimeSeconds: number;
        responseTimeMs: number;
        checks: {
            db: {
                status: "up" | "down";
                error: string | null;
            };
        };
    }>;
    getOperational(): Promise<{
        timestamp: string;
        metrics: {
            solicitacoesAnamnesePendentes: number;
            pacientesSemAnamnese: number;
            pacientesSemEvolucao: number;
            uploadsExamesUltimas24h: number;
        };
    }>;
}
