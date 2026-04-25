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
import { ProfissionalPacienteVinculo } from './entities/profissional-paciente-vinculo.entity';
import { Atividade } from '../atividades/entities/atividade.entity';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { PacientesService } from './pacientes.service';
import { PacientesController } from './pacientes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Paciente,
      Evolucao,
      Laudo,
      Usuario,
      PacienteExame,
      ProfissionalPacienteVinculo,
      Atividade,
      Anamnese,
    ]),
  ],
  controllers: [PacientesController],
  providers: [PacientesService],
  exports: [PacientesService],
})
export class PacientesModule {}
