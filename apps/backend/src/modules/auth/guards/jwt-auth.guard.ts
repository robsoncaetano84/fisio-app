// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// JWT-AUTH.GUARD
// ==========================================
import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UserRole } from '../../usuarios/entities/usuario.entity';

/**
 * Autentica via JWT, respeitando rotas marcadas com @Public(). Registrado como
 * guard global (ver AppModule), roda antes do RolesGuard global, garantindo que
 * request.user ja esteja populado quando as roles forem avaliadas.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}

/**
 * Guard que autentica via JWT e, na MESMA passagem, aplica a restricao de
 * roles declarada por @Roles(). Necessario porque um RolesGuard global roda
 * ANTES do JwtAuthGuard de rota (quando request.user ainda nao existe), o que
 * fazia a checagem de role ser silenciosamente ignorada. Aqui a ordem e
 * garantida: primeiro autentica (popula request.user), depois valida a role.
 * Tambem respeita @Public() para permitir rotas abertas quando aplicado por rota.
 */
@Injectable()
export class JwtAuthRolesGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const authenticated = (await super.canActivate(context)) as boolean;
    if (!authenticated) {
      return false;
    }

    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: UserRole } | undefined;

    if (!user?.role || !roles.includes(user.role)) {
      throw new ForbiddenException('Acesso negado para o seu perfil');
    }

    return true;
  }
}
