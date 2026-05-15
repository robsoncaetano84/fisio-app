// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// CURRENT USER.DECORATOR
// ==========================================
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { Usuario } from '../../usuarios/entities/usuario.entity';

type AuthenticatedRequest = Request & {
  user?: Usuario;
};

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Usuario => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user as Usuario;
  },
);
