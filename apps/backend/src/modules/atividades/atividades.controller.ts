// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// ATIVIDADES.CONTROLLER
// ==========================================
import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { CreateAtividadeCheckinDto } from './dto/create-atividade-checkin.dto';
import { DuplicateAtividadeDto } from './dto/duplicate-atividade.dto';
import { DuplicateAtividadesBatchDto } from './dto/duplicate-atividades-batch.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { GenerateAtividadeAiDto } from './dto/generate-atividade-ai.dto';
import { AtividadesService } from './atividades.service';

@Controller('atividades')
@UseGuards(JwtAuthGuard)
export class AtividadesController {
  constructor(private readonly atividadesService: AtividadesService) {}

  @Post('sugestao-ia')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  generateAiSuggestion(
    @Body() dto: GenerateAtividadeAiDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.atividadesService.generateAiSuggestion(dto, usuario.id);
  }
  @Post()
  @Throttle({ default: { ttl: 60, limit: 30 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  create(@Body() dto: CreateAtividadeDto, @CurrentUser() usuario: Usuario) {
    return this.atividadesService.create(dto, usuario.id);
  }

  @Get()
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  findByPaciente(
    @Query('pacienteId', ParseUUIDPipe) pacienteId: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.atividadesService.findByPaciente(pacienteId, usuario.id);
  }

  @Patch(':id/inativar')
  @Throttle({ default: { ttl: 60, limit: 60 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  inativar(
    @Param('id', ParseUUIDPipe) atividadeId: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.atividadesService.inativar(atividadeId, usuario.id);
  }

  @Post(':id/duplicar')
  @Throttle({ default: { ttl: 60, limit: 60 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  duplicar(
    @Param('id', ParseUUIDPipe) atividadeId: string,
    @Body() dto: DuplicateAtividadeDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.atividadesService.duplicar(atividadeId, usuario.id, dto);
  }

  @Post('duplicar-lote')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  duplicarLote(
    @Body() dto: DuplicateAtividadesBatchDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.atividadesService.duplicarLote(usuario.id, dto);
  }

  @Patch(':id')
  @Throttle({ default: { ttl: 60, limit: 60 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  update(
    @Param('id', ParseUUIDPipe) atividadeId: string,
    @Body() dto: UpdateAtividadeDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.atividadesService.update(atividadeId, dto, usuario.id);
  }

  @Get('minhas')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.PACIENTE)
  findMinhas(@CurrentUser() usuario: Usuario) {
    return this.atividadesService.findMinhasAtividades(usuario);
  }

  @Get('checkins')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  findCheckinsByPaciente(
    @Query('pacienteId', ParseUUIDPipe) pacienteId: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.atividadesService.findCheckinsByPaciente(
      pacienteId,
      usuario.id,
    );
  }

  @Get('updates')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  findUpdates(
    @CurrentUser() usuario: Usuario,
    @Query('since') since?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    return this.atividadesService.findUpdatesByProfissional(usuario.id, {
      since,
      limit: Number.isFinite(parsedLimit as number) ? parsedLimit : undefined,
    });
  }

  @Post(':id/checkins')
  @Throttle({ default: { ttl: 60, limit: 40 } })
  @Roles(UserRole.PACIENTE)
  createMeuCheckin(
    @Param('id', ParseUUIDPipe) atividadeId: string,
    @Body() dto: CreateAtividadeCheckinDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.atividadesService.createMeuCheckin(atividadeId, dto, usuario);
  }

  @Get(':id/checkins')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  findCheckinsByAtividade(
    @Param('id', ParseUUIDPipe) atividadeId: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.atividadesService.findCheckinsByAtividade(
      atividadeId,
      usuario.id,
    );
  }
}
