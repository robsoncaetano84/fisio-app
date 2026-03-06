import { ConfigService } from '@nestjs/config';
type LockoutRecord = {
    count: number;
    firstAttemptAt: number;
    lockedUntil?: number;
};
export declare class LockoutService {
    private readonly configService;
    private readonly inMemory;
    private readonly redis?;
    private readonly useRedis;
    constructor(configService: ConfigService);
    private getKey;
    private lockoutWindowMs;
    private lockoutDurationMs;
    private maxAttempts;
    private getRecord;
    private setRecord;
    reset(email: string): Promise<void>;
    isLocked(email: string): Promise<boolean>;
    registerFailure(email: string): Promise<LockoutRecord>;
}
export {};
