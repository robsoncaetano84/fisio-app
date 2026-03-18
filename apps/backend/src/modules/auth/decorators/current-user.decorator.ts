// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// C UR RE NT U SE R.D EC OR AT OR
// ==========================================
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Usuario => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
