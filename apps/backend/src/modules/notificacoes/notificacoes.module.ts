// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// N OT IF IC AC OE S.M OD UL E
// ==========================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushToken } from './entities/push-token.entity';
import { NotificacoesService } from './notificacoes.service';
import { NotificacoesController } from './notificacoes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PushToken])],
  controllers: [NotificacoesController],
  providers: [NotificacoesService],
  exports: [NotificacoesService],
})
export class NotificacoesModule {}

