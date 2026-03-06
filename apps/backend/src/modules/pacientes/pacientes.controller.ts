// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// P AC IE NT ES.C ON TR OL LE R
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
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../usuarios/entities/usuario.entity';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PacienteProfileResponseDto } from './dto/paciente-profile-response.dto';

@Controller('pacientes')
@UseGuards(JwtAuthGuard)
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Post()
  @Throttle({ default: { ttl: 60, limit: 30 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  create(
    @Body() createPacienteDto: CreatePacienteDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.pacientesService.create(createPacienteDto, usuario.id);
  }

  @Get()
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  findAll(@CurrentUser() usuario: Usuario) {
    return this.pacientesService.findAll(usuario.id);
  }

  @Get('paged')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  findPaged(
    @CurrentUser() usuario: Usuario,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    return this.pacientesService.findPaged(usuario.id, page, limit);
  }

  @Get('attention')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  getAttention(@CurrentUser() usuario: Usuario) {
    return this.pacientesService.getAttentionMap(usuario.id);
  }

  @Get('stats')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  @Roles(UserRole.ADMIN)
  getStats(@CurrentUser() usuario: Usuario) {
    return this.pacientesService.getStats(usuario.id);
  }

  @Get('me')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.PACIENTE)
  getMyPacienteProfile(
    @CurrentUser() usuario: Usuario,
  ): Promise<PacienteProfileResponseDto> {
    return this.pacientesService.getMyPacienteProfile(usuario);
  }

  @Get(':id')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.pacientesService.findOne(id, usuario.id);
  }

  @Patch(':id')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePacienteDto: UpdatePacienteDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.pacientesService.update(id, updatePacienteDto, usuario.id);
  }

  @Delete(':id')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.pacientesService.remove(id, usuario.id);
  }
}
