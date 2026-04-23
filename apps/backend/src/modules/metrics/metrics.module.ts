import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Atividade } from '../atividades/entities/atividade.entity';
import { AtividadeCheckin } from '../atividades/entities/atividade-checkin.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { ClinicalFlowEvent } from './entities/clinical-flow-event.entity';
import { PatientCheckClickEvent } from './entities/patient-check-click-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicalFlowEvent,
      PatientCheckClickEvent,
      AtividadeCheckin,
      Laudo,
      Paciente,
      Anamnese,
      Atividade,
    ]),
  ],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
