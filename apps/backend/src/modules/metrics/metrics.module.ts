import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtividadeCheckin } from '../atividades/entities/atividade-checkin.entity';
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
    ]),
  ],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
