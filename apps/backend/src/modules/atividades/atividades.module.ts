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
import { Laudo } from '../laudos/entities/laudo.entity';
import { AtividadesController } from './atividades.controller';
import { ExerciciosController } from './exercicios.controller';
import { AtividadeAiSuggestionService } from './atividade-ai-suggestion.service';
import { AtividadesService } from './atividades.service';
import { ExerciciosCatalogService } from './exercicios-catalog.service';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { OpenAiModule } from '../ai/openai.module';

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
      Laudo,
    ]),
    NotificacoesModule,
    OpenAiModule,
  ],
  controllers: [AtividadesController, ExerciciosController],
  providers: [
    AtividadesService,
    AtividadeAiSuggestionService,
    ExerciciosCatalogService,
  ],
  exports: [AtividadesService],
})
export class AtividadesModule {}
