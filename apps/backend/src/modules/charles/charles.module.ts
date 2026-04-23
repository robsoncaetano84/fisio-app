import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
import { PacientesModule } from '../pacientes/pacientes.module';
import { CharlesController } from './charles.controller';
import { CharlesService } from './charles.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Anamnese, Evolucao, Laudo]),
    PacientesModule,
  ],
  controllers: [CharlesController],
  providers: [CharlesService],
  exports: [CharlesService],
})
export class CharlesModule {}

