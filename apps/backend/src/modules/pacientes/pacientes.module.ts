// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// P AC IE NT ES.M OD UL E
// ==========================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paciente } from './entities/paciente.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PacientesService } from './pacientes.service';
import { PacientesController } from './pacientes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Paciente, Evolucao, Laudo, Usuario])],
  controllers: [PacientesController],
  providers: [PacientesService],
  exports: [PacientesService],
})
export class PacientesModule {}
