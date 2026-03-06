import { Repository } from 'typeorm';
import { AuthEventType, AuthLog } from './entities/auth-log.entity';
export declare class AuthLogsService {
    private readonly authLogRepository;
    constructor(authLogRepository: Repository<AuthLog>);
    record(params: {
        email: string;
        eventType: AuthEventType;
        success: boolean;
        ip?: string;
        usuarioId?: string;
        reason?: string;
    }): Promise<AuthLog>;
}
