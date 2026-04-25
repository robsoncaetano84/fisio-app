// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// ANAMNESES.CONTROLLER
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
import { AnamnesesService } from './anamneses.service';
import { CreateAnamneseDto } from './dto/create-anamnese.dto';
import { UpdateAnamneseDto } from './dto/update-anamnese.dto';
import { CreateMyAnamneseDto } from './dto/create-my-anamnese.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';

@Controller('anamneses')
@UseGuards(JwtAuthGuard)
export class AnamnesesController {
  constructor(private readonly anamnesesService: AnamnesesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @Throttle({ default: { ttl: 60, limit: 30 } })
  create(
    @Body() createAnamneseDto: CreateAnamneseDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.anamnesesService.create(createAnamneseDto, usuario.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @Throttle({ default: { ttl: 60, limit: 120 } })
  findAllByPaciente(
    @Query('pacienteId', ParseUUIDPipe) pacienteId: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.anamnesesService.findAllByPaciente(pacienteId, usuario.id);
  }

  @Get('paciente/:pacienteId/historico')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @Throttle({ default: { ttl: 60, limit: 120 } })
  findHistoryByPaciente(
    @Param('pacienteId', ParseUUIDPipe) pacienteId: string,
    @Query('limit') limitRaw: string | undefined,
    @CurrentUser() usuario: Usuario,
  ) {
    const limit = Number(limitRaw || 50);
    return this.anamnesesService.findHistoryByPaciente(
      pacienteId,
      usuario.id,
      limit,
    );
  }

  @Get('me/latest')
  @Roles(UserRole.PACIENTE)
  @Throttle({ default: { ttl: 60, limit: 60 } })
  findMyLatest(@CurrentUser() usuario: Usuario) {
    return this.anamnesesService.findLatestByPacienteUsuario(usuario.id);
  }

  @Get('me/historico')
  @Roles(UserRole.PACIENTE)
  @Throttle({ default: { ttl: 60, limit: 60 } })
  findMyHistory(
    @Query('limit') limitRaw: string | undefined,
    @CurrentUser() usuario: Usuario,
  ) {
    const limit = Number(limitRaw || 50);
    return this.anamnesesService.findHistoryByPacienteUsuario(
      usuario.id,
      limit,
    );
  }

  @Post('me')
  @Roles(UserRole.PACIENTE)
  @Throttle({ default: { ttl: 60, limit: 20 } })
  createMy(
    @Body() createMyAnamneseDto: CreateMyAnamneseDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.anamnesesService.createForPacienteUsuario(
      createMyAnamneseDto,
      usuario.id,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @Throttle({ default: { ttl: 60, limit: 120 } })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.anamnesesService.findOne(id, usuario.id);
  }

  @Get(':id/historico')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @Throttle({ default: { ttl: 60, limit: 120 } })
  findHistoryByAnamnese(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limitRaw: string | undefined,
    @CurrentUser() usuario: Usuario,
  ) {
    const limit = Number(limitRaw || 20);
    return this.anamnesesService.findHistoryByAnamnese(id, usuario.id, limit);
  }

  @Patch('me/:id')
  @Roles(UserRole.PACIENTE)
  @Throttle({ default: { ttl: 60, limit: 20 } })
  updateMy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAnamneseDto: UpdateAnamneseDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.anamnesesService.updateByPacienteUsuario(
      id,
      updateAnamneseDto,
      usuario.id,
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @Throttle({ default: { ttl: 60, limit: 30 } })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAnamneseDto: UpdateAnamneseDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.anamnesesService.update(id, updateAnamneseDto, usuario.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @Throttle({ default: { ttl: 60, limit: 20 } })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.anamnesesService.remove(id, usuario.id);
  }
}
