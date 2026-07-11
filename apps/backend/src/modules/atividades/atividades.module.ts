// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// ATIVIDADES.MODULE
// ==========================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Atividade } from './entities/atividade.entity';
import { AtividadeCheckin } from './entities/atividade-checkin.entity';
import { AtividadeAiGeneration } from './entities/atividade-ai-generation.entity';
import { Exercicio } from './entities/exercicio.entity';
import { ExercicioMidia } from './entities/exercicio-midia.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { AtividadesController } from './atividades.controller';
import { AtividadeAiSuggestionService } from './atividade-ai-suggestion.service';
import { AtividadesService } from './atividades.service';
import { ExerciciosController } from './exercicios.controller';
import { ExerciciosCatalogService } from './exercicios-catalog.service';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { OpenAiModule } from '../ai/openai.module';

// Etapa-38: os endpoints do catalogo de exercicios ficam atras de flag ate o
// go-live. O service e sempre provido (usado internamente/plano IA); o
// controller so e montado quando EXERCISE_CATALOG_ENABLED=true.
const exerciseCatalogEnabled = process.env.EXERCISE_CATALOG_ENABLED === 'true';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Atividade,
      AtividadeCheckin,
      AtividadeAiGeneration,
      Exercicio,
      ExercicioMidia,
      Paciente,
      Anamnese,
    ]),
    NotificacoesModule,
    OpenAiModule,
  ],
  controllers: [
    AtividadesController,
    ...(exerciseCatalogEnabled ? [ExerciciosController] : []),
  ],
  providers: [
    AtividadesService,
    AtividadeAiSuggestionService,
    ExerciciosCatalogService,
  ],
  exports: [AtividadesService, ExerciciosCatalogService],
})
export class AtividadesModule {}
