// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// L AU DO S.CONTROLLER
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
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { LaudosService } from './laudos.service';
import { CreateLaudoDto } from './dto/create-laudo.dto';
import { UpdateLaudoDto } from './dto/update-laudo.dto';
import { GenerateLaudoDto } from './dto/generate-laudo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../usuarios/entities/usuario.entity';

@Controller('laudos')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN, UserRole.USER)
export class LaudosController {
  constructor(private readonly laudosService: LaudosService) {}

  @Post()
  @Throttle({ default: { ttl: 60, limit: 30 } })
  create(
    @Body() createLaudoDto: CreateLaudoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.create(createLaudoDto, usuario.id);
  }

  @Get()
  @Throttle({ default: { ttl: 60, limit: 120 } })
  findByPaciente(
    @Query('pacienteId', ParseUUIDPipe) pacienteId: string,
    @Query('autoGenerate') autoGenerate: string | undefined,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.findByPaciente(
      pacienteId,
      usuario.id,
      autoGenerate === 'true',
    );
  }

  @Post('gerar')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  generateByPaciente(
    @Body() generateLaudoDto: GenerateLaudoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.generateAndSaveByPaciente(
      generateLaudoDto.pacienteId,
      usuario.id,
    );
  }

  @Post('sugestao-ia')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  suggestByPaciente(
    @Body() generateLaudoDto: GenerateLaudoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.generateSuggestionPreview(
      generateLaudoDto.pacienteId,
      usuario.id,
    );
  }

  @Get('referencias-sugeridas')
  @Throttle({ default: { ttl: 60, limit: 60 } })
  getSuggestedReferences(
    @Query('pacienteId', ParseUUIDPipe) pacienteId: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.getSuggestedReferences(pacienteId, usuario.id);
  }

  @Get('self/pdf-laudo')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  @Roles(UserRole.PACIENTE)
  async myPdfLaudo(
    @CurrentUser() usuario: Usuario,
    @Res() res: Response,
  ) {
    const pdf = await this.laudosService.buildPdfBufferByPacienteUsuario(
      usuario.id,
      'laudo',
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="meu-laudo.pdf"');
    res.send(pdf);
  }

  @Get('self/pdf-plano')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  @Roles(UserRole.PACIENTE)
  async myPdfPlano(
    @CurrentUser() usuario: Usuario,
    @Res() res: Response,
  ) {
    const pdf = await this.laudosService.buildPdfBufferByPacienteUsuario(
      usuario.id,
      'plano',
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="meu-plano-tratamento.pdf"',
    );
    res.send(pdf);
  }

  @Get('self')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.PACIENTE)
  findMyLatest(@CurrentUser() usuario: Usuario) {
    return this.laudosService.findLatestByPacienteUsuario(usuario.id);
  }

  @Get(':id')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.findOne(id, usuario.id);
  }

  @Get(':id/exame-fisico-historico')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  findExameFisicoHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limitRaw: string | undefined,
    @CurrentUser() usuario: Usuario,
  ) {
    const limit = Number(limitRaw || 20);
    return this.laudosService.findExameFisicoHistory(id, usuario.id, limit);
  }

  @Get(':id/pdf-laudo')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  async pdfLaudo(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('consultedRefs') consultedRefs: string | undefined,
    @CurrentUser() usuario: Usuario,
    @Res() res: Response,
  ) {
    const pdf = await this.laudosService.buildPdfBuffer(
      id,
      usuario.id,
      'laudo',
      {
        consultedReferenceIds: (consultedRefs || '')
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
      },
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="laudo-${id}.pdf"`);
    res.send(pdf);
  }

  @Get(':id/pdf-plano')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  async pdfPlano(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('consultedRefs') consultedRefs: string | undefined,
    @CurrentUser() usuario: Usuario,
    @Res() res: Response,
  ) {
    const pdf = await this.laudosService.buildPdfBuffer(
      id,
      usuario.id,
      'plano',
      {
        consultedReferenceIds: (consultedRefs || '')
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
      },
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="plano-tratamento-${id}.pdf"`,
    );
    res.send(pdf);
  }

  @Patch(':id')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLaudoDto: UpdateLaudoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.update(id, updateLaudoDto, usuario.id);
  }

  @Post(':id/validar')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  validar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.validarLaudo(id, usuario.id);
  }

  @Delete(':id')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.remove(id, usuario.id);
  }
}
