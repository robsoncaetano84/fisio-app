import { BaseEntity } from '../../../common/entities/base.entity';
export declare enum AuthEventType {
    LOGIN = "LOGIN",
    REFRESH = "REFRESH"
}
export declare class AuthLog extends BaseEntity {
    usuarioId?: string;
    email: string;
    ip?: string;
    eventType: AuthEventType;
    success: boolean;
    reason?: string;
}
