// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// A NA MN ES ES.C ON TR OL LE R
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

  @Get('me/latest')
  @Roles(UserRole.PACIENTE)
  @Throttle({ default: { ttl: 60, limit: 60 } })
  findMyLatest(@CurrentUser() usuario: Usuario) {
    return this.anamnesesService.findLatestByPacienteUsuario(usuario.id);
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
