// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// A NA MN ES ES.M OD UL E
// ==========================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Anamnese } from './entities/anamnese.entity';
import { AnamneseHistorico } from './entities/anamnese-historico.entity';
import { AnamnesesService } from './anamneses.service';
import { AnamnesesController } from './anamneses.controller';
import { PacientesModule } from '../pacientes/pacientes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Anamnese, AnamneseHistorico]), PacientesModule],
  controllers: [AnamnesesController],
  providers: [AnamnesesService],
  exports: [AnamnesesService],
})
export class AnamnesesModule {}
