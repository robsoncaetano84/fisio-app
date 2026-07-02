// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// L AU DO S.M OD UL E
// ==========================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Laudo } from './entities/laudo.entity';
import { LaudoAiGeneration } from './entities/laudo-ai-generation.entity';
import { LaudoHistorico } from './entities/laudo-historico.entity';
import { LaudosService } from './laudos.service';
import { LaudosController } from './laudos.controller';
import { PacientesModule } from '../pacientes/pacientes.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Laudo,
      LaudoAiGeneration,
      LaudoHistorico,
      Anamnese,
      Evolucao,
    ]),
    PacientesModule,
    UsuariosModule,
  ],
  controllers: [LaudosController],
  providers: [LaudosService],
  exports: [LaudosService],
})
export class LaudosModule {}
