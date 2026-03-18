// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// L AU DO S.C ON TR OL LE R
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
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';
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
export class LaudosController {
  constructor(
    private readonly laudosService: LaudosService,
    private readonly configService: ConfigService,
  ) {}

  private resolveUsuarioIdFromAccessToken(token: string | undefined): string {
    if (!token) {
      throw new UnauthorizedException('Token nao informado');
    }
    const secret = this.configService.get<string>('JWT_SECRET') || 'default-secret';
    try {
      const payload = verify(token, secret) as { sub?: string };
      if (!payload?.sub) {
        throw new UnauthorizedException('Token invalido');
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Token invalido');
    }
  }

  private resolveUsuarioIdFromRequest(req: Request, token?: string): string {
    const authHeader = String(req.headers.authorization || '');
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '');
    return this.resolveUsuarioIdFromAccessToken(token || bearerToken || undefined);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60, limit: 30 } })
  create(@Body() createLaudoDto: CreateLaudoDto, @CurrentUser() usuario: Usuario) {
    return this.laudosService.create(createLaudoDto, usuario.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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

  @Get('referencias-sugeridas')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60, limit: 60 } })
  getSuggestedReferences(
    @Query('pacienteId', ParseUUIDPipe) pacienteId: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.getSuggestedReferences(pacienteId, usuario.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60, limit: 120 } })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.findOne(id, usuario.id);
  }

  @Get(':id/pdf-laudo')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  async pdfLaudo(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Query('token') token: string | undefined,
    @Query('consultedRefs') consultedRefs: string | undefined,
    @Res() res: Response,
  ) {
    const usuarioId = this.resolveUsuarioIdFromRequest(req, token);
    const pdf = await this.laudosService.buildPdfBuffer(id, usuarioId, 'laudo', {
      consultedReferenceIds: (consultedRefs || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="laudo-${id}.pdf"`,
    );
    res.send(pdf);
  }

  @Get('self')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.PACIENTE)
  findMyLatest(@CurrentUser() usuario: Usuario) {
    return this.laudosService.findLatestByPacienteUsuario(usuario.id);
  }

  @Get('self/pdf-laudo')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  async myPdfLaudo(
    @Req() req: Request,
    @Query('token') token: string | undefined,
    @Res() res: Response,
  ) {
    const usuarioId = this.resolveUsuarioIdFromRequest(req, token);
    const pdf = await this.laudosService.buildPdfBufferByPacienteUsuario(
      usuarioId,
      'laudo',
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="meu-laudo.pdf"');
    res.send(pdf);
  }

  @Get('self/pdf-plano')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  async myPdfPlano(
    @Req() req: Request,
    @Query('token') token: string | undefined,
    @Res() res: Response,
  ) {
    const usuarioId = this.resolveUsuarioIdFromRequest(req, token);
    const pdf = await this.laudosService.buildPdfBufferByPacienteUsuario(
      usuarioId,
      'plano',
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="meu-plano-tratamento.pdf"',
    );
    res.send(pdf);
  }

  @Get(':id/pdf-plano')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  async pdfPlano(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Query('token') token: string | undefined,
    @Query('consultedRefs') consultedRefs: string | undefined,
    @Res() res: Response,
  ) {
    const usuarioId = this.resolveUsuarioIdFromRequest(req, token);
    const pdf = await this.laudosService.buildPdfBuffer(id, usuarioId, 'plano', {
      consultedReferenceIds: (consultedRefs || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="plano-tratamento-${id}.pdf"`,
    );
    res.send(pdf);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60, limit: 30 } })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLaudoDto: UpdateLaudoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.update(id, updateLaudoDto, usuario.id);
  }

  @Post(':id/validar')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60, limit: 20 } })
  validar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.validarLaudo(id, usuario.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60, limit: 20 } })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.remove(id, usuario.id);
  }
}
