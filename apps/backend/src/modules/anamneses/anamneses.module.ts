// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// A NA MN ES ES.M OD UL E
// ==========================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Anamnese } from './entities/anamnese.entity';
import { AnamnesesService } from './anamneses.service';
import { AnamnesesController } from './anamneses.controller';
import { PacientesModule } from '../pacientes/pacientes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Anamnese]), PacientesModule],
  controllers: [AnamnesesController],
  providers: [AnamnesesService],
  exports: [AnamnesesService],
})
export class AnamnesesModule {}
