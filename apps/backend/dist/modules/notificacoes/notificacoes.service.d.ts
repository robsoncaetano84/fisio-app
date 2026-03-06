import { Repository } from 'typeorm';
import { PushToken } from './entities/push-token.entity';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
type PushPayload = {
    title: string;
    body: string;
    data?: Record<string, string>;
};
export declare class NotificacoesService {
    private readonly pushTokenRepository;
    private readonly logger;
    constructor(pushTokenRepository: Repository<PushToken>);
    registerToken(usuarioId: string, dto: RegisterPushTokenDto): Promise<PushToken>;
    removeToken(usuarioId: string, expoPushToken: string): Promise<void>;
    sendToUsuario(usuarioId: string, payload: PushPayload): Promise<void>;
}
export {};
