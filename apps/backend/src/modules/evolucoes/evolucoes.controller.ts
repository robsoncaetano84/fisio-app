// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// E VO LU CO ES.C ON TR OL LE R
// ==========================================
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EvolucoesService } from './evolucoes.service';
import { CreateEvolucaoDto } from './dto/create-evolucao.dto';
import { UpdateEvolucaoDto } from './dto/update-evolucao.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Controller('evolucoes')
@UseGuards(JwtAuthGuard)
export class EvolucoesController {
  constructor(private readonly evolucoesService: EvolucoesService) {}

  @Post()
  @Throttle({ default: { ttl: 60, limit: 30 } })
  create(
    @Body() createEvolucaoDto: CreateEvolucaoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.evolucoesService.create(createEvolucaoDto, usuario.id);
  }

  @Get()
  @Throttle({ default: { ttl: 60, limit: 120 } })
  findAllByPaciente(
    @Query('pacienteId', ParseUUIDPipe) pacienteId: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.evolucoesService.findAllByPaciente(pacienteId, usuario.id);
  }

  @Get(':id')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.evolucoesService.findOne(id, usuario.id);
  }

  @Patch(':id')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEvolucaoDto: UpdateEvolucaoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.evolucoesService.update(id, updateEvolucaoDto, usuario.id);
  }

  @Delete(':id')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.evolucoesService.remove(id, usuario.id);
  }
}
