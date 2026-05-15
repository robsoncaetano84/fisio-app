// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// ATIVIDADES.MODULE
// ==========================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Atividade } from './entities/atividade.entity';
import { AtividadeCheckin } from './entities/atividade-checkin.entity';
import { AtividadeAiGeneration } from './entities/atividade-ai-generation.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { AtividadesController } from './atividades.controller';
import { AtividadeAiSuggestionService } from './atividade-ai-suggestion.service';
import { AtividadesService } from './atividades.service';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { OpenAiModule } from '../ai/openai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Atividade,
      AtividadeCheckin,
      AtividadeAiGeneration,
      Paciente,
      Anamnese,
    ]),
    NotificacoesModule,
    OpenAiModule,
  ],
  controllers: [AtividadesController],
  providers: [AtividadesService, AtividadeAiSuggestionService],
  exports: [AtividadesService],
})
export class AtividadesModule {}
