// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// E VO LU CO ES.M OD UL E
// ==========================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evolucao } from './entities/evolucao.entity';
import { EvolucoesService } from './evolucoes.service';
import { EvolucoesController } from './evolucoes.controller';
import { PacientesModule } from '../pacientes/pacientes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Evolucao]), PacientesModule],
  controllers: [EvolucoesController],
  providers: [EvolucoesService],
  exports: [EvolucoesService],
})
export class EvolucoesModule {}
