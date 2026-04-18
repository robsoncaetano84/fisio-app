import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { ClinicalFlowEvent } from './entities/clinical-flow-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicalFlowEvent])],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}

