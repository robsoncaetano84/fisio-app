// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// J WT.S TR AT EG Y
// ==========================================
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { UsuariosService } from '../../usuarios/usuarios.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tokenVersion?: number;
}

function extractCommunitySessionCookie(request?: Request): string | null {
  const cookieHeader = request?.headers?.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((item) => item.trim());
  const sessionCookie = cookies.find((item) =>
    item.startsWith('synap_community_session='),
  );

  if (!sessionCookie) return null;
  const [, rawValue] = sessionCookie.split('=');
  if (!rawValue) return null;

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET nao configurado');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        extractCommunitySessionCookie,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const usuario = await this.usuariosService.findById(payload.sub);

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Usuario nao autorizado');
    }

    // F9: token revogado (logout incrementa tokenVersion). Tokens antigos sem o
    // claim sao tratados como versao 0 para nao invalidar sessoes no deploy.
    if ((payload.tokenVersion ?? 0) !== (usuario.tokenVersion ?? 0)) {
      throw new UnauthorizedException('Sessao expirada');
    }

    return usuario;
  }
}
