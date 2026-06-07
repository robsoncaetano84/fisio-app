// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// P AC IE NT ES.MODULE
// ==========================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paciente } from './entities/paciente.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PacienteExame } from './entities/paciente-exame.entity';
import { ClinicalPhoto } from './entities/clinical-photo.entity';
import { ClinicalPhotoComparison } from './entities/clinical-photo-comparison.entity';
import { ProfissionalPacienteVinculo } from './entities/profissional-paciente-vinculo.entity';
import { Atividade } from '../atividades/entities/atividade.entity';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { PacientesService } from './pacientes.service';
import { PacientesController } from './pacientes.controller';
import { OpenAiModule } from '../ai/openai.module';
import { ClinicalPhotoAiService } from './clinical-photo-ai.service';
import { PacienteMediaService } from './paciente-media.service';
import { PacienteListService } from './paciente-list.service';
import { PacienteVinculoService } from './paciente-vinculo.service';
import { PacienteDashboardService } from './paciente-dashboard.service';
import { PacienteSelfProfileService } from './paciente-self-profile.service';
import { PacienteScopeService } from './paciente-scope.service';
import { PacienteProfessionalService } from './paciente-professional.service';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Paciente,
      Evolucao,
      Laudo,
      Usuario,
      PacienteExame,
      ClinicalPhoto,
      ClinicalPhotoComparison,
      ProfissionalPacienteVinculo,
      Atividade,
      Anamnese,
    ]),
    OpenAiModule,
    NotificacoesModule,
  ],
  controllers: [PacientesController],
  providers: [
    PacientesService,
    ClinicalPhotoAiService,
    PacienteMediaService,
    PacienteListService,
    PacienteVinculoService,
    PacienteDashboardService,
    PacienteSelfProfileService,
    PacienteScopeService,
    PacienteProfessionalService,
  ],
  exports: [PacientesService],
})
export class PacientesModule {}
