import { BaseEntity } from '../../../common/entities/base.entity';
export declare class CrmAdminAuditLog extends BaseEntity {
    actorId: string;
    actorEmail: string;
    action: string;
    includeSensitive: boolean;
    sensitiveReason: string | null;
    metadata: Record<string, unknown> | null;
}
