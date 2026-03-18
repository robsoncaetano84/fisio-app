// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// N OT IF IC AC OE S.S ER VI CE
// ==========================================
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PushToken } from './entities/push-token.entity';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

@Injectable()
export class NotificacoesService {
  private readonly logger = new Logger(NotificacoesService.name);

  constructor(
    @InjectRepository(PushToken)
    private readonly pushTokenRepository: Repository<PushToken>,
  ) {}

  async registerToken(usuarioId: string, dto: RegisterPushTokenDto): Promise<PushToken> {
    const token = dto.expoPushToken.trim();

    const existing = await this.pushTokenRepository.findOne({
      where: { expoPushToken: token },
    });

    if (existing) {
      existing.usuarioId = usuarioId;
      existing.ativo = true;
      existing.plataforma = dto.plataforma?.trim() || null;
      existing.appVersion = dto.appVersion?.trim() || null;
      return this.pushTokenRepository.save(existing);
    }

    const created = this.pushTokenRepository.create({
      usuarioId,
      expoPushToken: token,
      plataforma: dto.plataforma?.trim() || null,
      appVersion: dto.appVersion?.trim() || null,
      ativo: true,
      ultimoEnvioEm: null,
    });

    return this.pushTokenRepository.save(created);
  }

  async removeToken(usuarioId: string, expoPushToken: string): Promise<void> {
    await this.pushTokenRepository.update(
      { usuarioId, expoPushToken: expoPushToken.trim() },
      { ativo: false },
    );
  }

  async sendToUsuario(usuarioId: string, payload: PushPayload): Promise<void> {
    const tokens = await this.pushTokenRepository.find({
      where: { usuarioId, ativo: true },
      order: { updatedAt: 'DESC' },
      take: 10,
    });

    if (!tokens.length) {
      return;
    }

    const messages = tokens.map((token) => ({
      to: token.expoPushToken,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
    }));

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const expoAccessToken = (process.env.EXPO_ACCESS_TOKEN || '').trim();
    if (expoAccessToken) {
      headers.Authorization = `Bearer ${expoAccessToken}`;
    }

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers,
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        const responseText = await response.text();
        this.logger.warn(
          `Falha ao enviar push (${response.status}): ${responseText || 'sem corpo'}`,
        );
        return;
      }

      const responseJson = (await response.json()) as {
        data?: Array<{
          status?: string;
          details?: { error?: string };
        }>;
      };

      const invalidTokens = tokens
        .filter((_, index) => responseJson.data?.[index]?.details?.error === 'DeviceNotRegistered')
        .map((item) => item.expoPushToken);

      if (invalidTokens.length) {
        await this.pushTokenRepository.update(
          { expoPushToken: In(invalidTokens) },
          { ativo: false },
        );
      }

      await this.pushTokenRepository.update(
        { id: In(tokens.map((token) => token.id)) },
        { ultimoEnvioEm: new Date() },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'erro desconhecido';
      this.logger.warn(`Falha de rede ao enviar push: ${message}`);
    }
  }
}

