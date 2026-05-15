// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// L AU DO S.MODULE
// ==========================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Laudo } from './entities/laudo.entity';
import { LaudoAiGeneration } from './entities/laudo-ai-generation.entity';
import { LaudosService } from './laudos.service';
import { LaudosController } from './laudos.controller';
import { PacientesModule } from '../pacientes/pacientes.module';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { PacienteExame } from '../pacientes/entities/paciente-exame.entity';
import { LaudoExameHistorico } from './entities/laudo-exame-historico.entity';
import { LaudoExameFisico } from './entities/laudo-exame-fisico.entity';
import { OpenAiModule } from '../ai/openai.module';
import { LaudoReferencesService } from './laudo-references.service';
import { LaudoPdfService } from './laudo-pdf.service';
import { LaudoAiSuggestionService } from './laudo-ai-suggestion.service';
import { LaudoExameFisicoService } from './laudo-exame-fisico.service';
import { LaudoAiGenerationQuotaService } from './laudo-ai-generation-quota.service';
import { LaudoClinicalContextService } from './laudo-clinical-context.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Laudo,
      LaudoAiGeneration,
      Anamnese,
      Evolucao,
      PacienteExame,
      LaudoExameHistorico,
      LaudoExameFisico,
    ]),
    PacientesModule,
    UsuariosModule,
    OpenAiModule,
  ],
  controllers: [LaudosController],
  providers: [
    LaudosService,
    LaudoReferencesService,
    LaudoPdfService,
    LaudoAiSuggestionService,
    LaudoExameFisicoService,
    LaudoAiGenerationQuotaService,
    LaudoClinicalContextService,
  ],
  exports: [LaudosService],
})
export class LaudosModule {}
