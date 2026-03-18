// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// N OT IF IC AC OE S.C ON TR OL LE R
// ==========================================
import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { RemovePushTokenDto } from './dto/remove-push-token.dto';
import { NotificacoesService } from './notificacoes.service';

@Controller('notificacoes')
@UseGuards(JwtAuthGuard)
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Post('token')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
  async registerPushToken(
    @Body() dto: RegisterPushTokenDto,
    @CurrentUser() usuario: Usuario,
  ) {
    const token = await this.notificacoesService.registerToken(usuario.id, dto);
    return {
      id: token.id,
      ativo: token.ativo,
      plataforma: token.plataforma,
      updatedAt: token.updatedAt,
    };
  }

  @Delete('token')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
  async removePushToken(
    @Body() dto: RemovePushTokenDto,
    @CurrentUser() usuario: Usuario,
  ) {
    await this.notificacoesService.removeToken(usuario.id, dto.expoPushToken);
    return { success: true };
  }
}

