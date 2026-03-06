// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// A TI VI DA DE S.M OD UL E
// ==========================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Atividade } from './entities/atividade.entity';
import { AtividadeCheckin } from './entities/atividade-checkin.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { AtividadesController } from './atividades.controller';
import { AtividadesService } from './atividades.service';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Atividade, AtividadeCheckin, Paciente]),
    NotificacoesModule,
  ],
  controllers: [AtividadesController],
  providers: [AtividadesService],
  exports: [AtividadesService],
})
export class AtividadesModule {}
