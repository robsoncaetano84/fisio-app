// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// R OL ES.G UA RD
// ==========================================
import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../usuarios/entities/usuario.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: UserRole } | undefined;

    if (!user?.role) {
      // RolesGuard e global (APP_GUARD) e pode rodar antes do JwtAuthGuard
      // de controlador/metodo. Nessa fase ainda nao existe request.user.
      // Deixamos seguir para o JwtAuthGuard autenticar a requisicao.
      return true;
    }

    return roles.includes(user.role);
  }
}
