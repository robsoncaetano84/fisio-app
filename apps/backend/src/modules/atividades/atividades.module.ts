// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// A TI VI DA DE S.M OD UL E
// ==========================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Atividade } from './entities/atividade.entity';
import { AtividadeCheckin } from './entities/atividade-checkin.entity';
import { Exercicio } from './entities/exercicio.entity';
import { ExercicioMidia } from './entities/exercicio-midia.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { AtividadesController } from './atividades.controller';
import { AtividadesService } from './atividades.service';
import { ExerciciosController } from './exercicios.controller';
import { ExerciciosCatalogService } from './exercicios-catalog.service';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

// Etapa-38: os endpoints do catalogo de exercicios ficam atras de flag ate o
// go-live. O service e sempre provido (usado internamente/plano IA); o
// controller so e montado quando EXERCISE_CATALOG_ENABLED=true.
const exerciseCatalogEnabled =
  process.env.EXERCISE_CATALOG_ENABLED === 'true';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Atividade,
      AtividadeCheckin,
      Exercicio,
      ExercicioMidia,
      Paciente,
    ]),
    NotificacoesModule,
  ],
  controllers: [
    AtividadesController,
    ...(exerciseCatalogEnabled ? [ExerciciosController] : []),
  ],
  providers: [AtividadesService, ExerciciosCatalogService],
  exports: [AtividadesService, ExerciciosCatalogService],
})
export class AtividadesModule {}
