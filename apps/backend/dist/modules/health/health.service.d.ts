import { DataSource } from 'typeorm';
export declare class HealthService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    check(): Promise<{
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
}
