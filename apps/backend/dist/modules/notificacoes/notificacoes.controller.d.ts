import { Usuario } from '../usuarios/entities/usuario.entity';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { RemovePushTokenDto } from './dto/remove-push-token.dto';
import { NotificacoesService } from './notificacoes.service';
export declare class NotificacoesController {
    private readonly notificacoesService;
    constructor(notificacoesService: NotificacoesService);
    registerPushToken(dto: RegisterPushTokenDto, usuario: Usuario): Promise<{
        id: string;
        ativo: boolean;
        plataforma: string | null;
        updatedAt: Date;
    }>;
    removePushToken(dto: RemovePushTokenDto, usuario: Usuario): Promise<{
        success: boolean;
    }>;
}
