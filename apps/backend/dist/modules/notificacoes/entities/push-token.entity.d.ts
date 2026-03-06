import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
export declare class PushToken extends BaseEntity {
    usuario: Usuario;
    usuarioId: string;
    expoPushToken: string;
    plataforma: string | null;
    appVersion: string | null;
    ativo: boolean;
    ultimoEnvioEm: Date | null;
}
