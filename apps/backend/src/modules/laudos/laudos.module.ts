// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// L AU DO S.M OD UL E
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Laudo,
      LaudoAiGeneration,
      Anamnese,
      Evolucao,
      PacienteExame,
      LaudoExameHistorico,
    ]),
    PacientesModule,
    UsuariosModule,
  ],
  controllers: [LaudosController],
  providers: [LaudosService],
  exports: [LaudosService],
})
export class LaudosModule {}
