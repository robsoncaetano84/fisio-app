// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
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
import { sign, verify } from 'jsonwebtoken';
import { LaudosService } from './laudos.service';
import { CreateLaudoDto } from './dto/create-laudo.dto';
import { UpdateLaudoDto } from './dto/update-laudo.dto';
import { GenerateLaudoDto } from './dto/generate-laudo.dto';
import { JwtAuthRolesGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../usuarios/entities/usuario.entity';

type PdfTipo = 'laudo' | 'plano';

// F4: token dedicado ao download de PDF. Curta duracao e escopo restrito
// (um laudo/tipo especifico), para que NUNCA circule o access token completo
// na URL — que vazaria em logs de proxy, historico e header Referer.
const PDF_TOKEN_PURPOSE = 'LAUDO_PDF';
const PDF_TOKEN_TTL_SECONDS = 300; // 5 min

interface PdfDownloadTokenPayload {
  sub: string;
  scope: string; // id do laudo, ou 'self' para o proprio paciente
  tipo: PdfTipo;
  purpose: typeof PDF_TOKEN_PURPOSE;
}

@Controller('laudos')
export class LaudosController {
  constructor(
    private readonly laudosService: LaudosService,
    private readonly configService: ConfigService,
  ) {}

  private getJwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || 'default-secret';
  }

  private normalizeTipo(tipo: string | undefined): PdfTipo {
    return tipo === 'plano' ? 'plano' : 'laudo';
  }

  private issuePdfDownloadToken(
    usuarioId: string,
    scope: string,
    tipo: PdfTipo,
  ): { token: string; expiresIn: number } {
    const token = sign(
      { sub: usuarioId, scope, tipo, purpose: PDF_TOKEN_PURPOSE },
      this.getJwtSecret(),
      { expiresIn: PDF_TOKEN_TTL_SECONDS },
    );
    return { token, expiresIn: PDF_TOKEN_TTL_SECONDS };
  }

  private resolveUsuarioIdFromAccessToken(token: string | undefined): string {
    if (!token) {
      throw new UnauthorizedException('Token nao informado');
    }
    try {
      const payload = verify(token, this.getJwtSecret()) as { sub?: string };
      if (!payload?.sub) {
        throw new UnauthorizedException('Token invalido');
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Token invalido');
    }
  }

  // Resolve o usuario para servir um PDF. Aceita o access token apenas pelo
  // header Authorization (nao vaza na URL). Pela query, aceita SOMENTE um token
  // de download com escopo (F4) — o access token cru na query e recusado.
  private resolveUsuarioIdForPdf(
    req: Request,
    queryToken: string | undefined,
    expected: { scope: string; tipo: PdfTipo },
  ): string {
    const authHeader = String(req.headers.authorization || '');
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (bearerToken) {
      return this.resolveUsuarioIdFromAccessToken(bearerToken);
    }

    if (!queryToken) {
      throw new UnauthorizedException('Token nao informado');
    }

    try {
      const payload = verify(
        queryToken,
        this.getJwtSecret(),
      ) as Partial<PdfDownloadTokenPayload>;
      if (
        payload?.purpose !== PDF_TOKEN_PURPOSE ||
        !payload?.sub ||
        payload.scope !== expected.scope ||
        payload.tipo !== expected.tipo
      ) {
        throw new UnauthorizedException('Token invalido');
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Token invalido');
    }
  }

  @Post()
  @UseGuards(JwtAuthRolesGuard)
  @Throttle({ default: { ttl: 60, limit: 30 } })
  create(@Body() createLaudoDto: CreateLaudoDto, @CurrentUser() usuario: Usuario) {
    return this.laudosService.create(createLaudoDto, usuario.id);
  }

  @Post('gerar')
  @UseGuards(JwtAuthRolesGuard)
  @Throttle({ default: { ttl: 60, limit: 20 } })
  generateByPaciente(
    @Body() generateLaudoDto: GenerateLaudoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.generateAndSaveByPaciente(
      generateLaudoDto.pacienteId,
      usuario.id,
      { regenerate: true },
    );
  }

  @Get()
  @UseGuards(JwtAuthRolesGuard)
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

  @Get('referencias-sugeridas')
  @UseGuards(JwtAuthRolesGuard)
  @Throttle({ default: { ttl: 60, limit: 60 } })
  getSuggestedReferences(
    @Query('pacienteId', ParseUUIDPipe) pacienteId: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.getSuggestedReferences(pacienteId, usuario.id);
  }

  // ---- Rotas do proprio paciente (self) declaradas antes de :id ----

  @Get('self')
  @UseGuards(JwtAuthRolesGuard)
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.PACIENTE)
  findMyLatest(@CurrentUser() usuario: Usuario) {
    return this.laudosService.findLatestByPacienteUsuario(usuario.id);
  }

  @Get('self/pdf-token')
  @UseGuards(JwtAuthRolesGuard)
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.PACIENTE)
  async selfPdfToken(
    @Query('tipo') tipo: string | undefined,
    @CurrentUser() usuario: Usuario,
  ) {
    const t = this.normalizeTipo(tipo);
    // Garante que existe laudo do paciente antes de emitir o token.
    await this.laudosService.findLatestByPacienteUsuario(usuario.id);
    return this.issuePdfDownloadToken(usuario.id, 'self', t);
  }

  @Get('self/pdf-laudo')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  async myPdfLaudo(
    @Req() req: Request,
    @Query('token') token: string | undefined,
    @Res() res: Response,
  ) {
    const usuarioId = this.resolveUsuarioIdForPdf(req, token, {
      scope: 'self',
      tipo: 'laudo',
    });
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
    const usuarioId = this.resolveUsuarioIdForPdf(req, token, {
      scope: 'self',
      tipo: 'plano',
    });
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

  // ---- Rotas por :id ----

  @Get(':id/pdf-token')
  @UseGuards(JwtAuthRolesGuard)
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  async pdfToken(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('tipo') tipo: string | undefined,
    @CurrentUser() usuario: Usuario,
  ) {
    const t = this.normalizeTipo(tipo);
    // Valida a posse do laudo pelo profissional antes de emitir o token.
    await this.laudosService.findOne(id, usuario.id);
    return this.issuePdfDownloadToken(usuario.id, id, t);
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
    const usuarioId = this.resolveUsuarioIdForPdf(req, token, {
      scope: id,
      tipo: 'laudo',
    });
    const pdf = await this.laudosService.buildPdfBuffer(id, usuarioId, 'laudo', {
      consultedReferenceIds: (consultedRefs || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="laudo-${id}.pdf"`);
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
    const usuarioId = this.resolveUsuarioIdForPdf(req, token, {
      scope: id,
      tipo: 'plano',
    });
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

  @Get(':id/historico')
  @UseGuards(JwtAuthRolesGuard)
  @Throttle({ default: { ttl: 60, limit: 60 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  findHistorico(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.findHistorico(id, usuario.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthRolesGuard)
  @Throttle({ default: { ttl: 60, limit: 120 } })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.findOne(id, usuario.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthRolesGuard)
  @Throttle({ default: { ttl: 60, limit: 30 } })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLaudoDto: UpdateLaudoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.update(id, updateLaudoDto, usuario.id);
  }

  @Post(':id/validar')
  @UseGuards(JwtAuthRolesGuard)
  @Throttle({ default: { ttl: 60, limit: 20 } })
  validar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.validarLaudo(id, usuario.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthRolesGuard)
  @Throttle({ default: { ttl: 60, limit: 20 } })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.laudosService.remove(id, usuario.id);
  }
}
