import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService, LoginResponse } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { CreatePacienteInviteDto } from './dto/create-paciente-invite.dto';
import { CreatePacienteConviteRapidoDto } from './dto/create-paciente-convite-rapido.dto';
import { RegistroPacientePorConviteDto } from './dto/registro-paciente-por-convite.dto';
import { AceitarPacienteInviteDto } from './dto/aceitar-paciente-convite.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuariosService: UsuariosService,
  ) {}

  @Post('login')
  @Throttle({ default: { ttl: 60, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<LoginResponse> {
    return this.authService.login(loginDto.email, loginDto.senha, {
      ip: req.ip,
    });
  }

  @Post('refresh')
  @Throttle({ default: { ttl: 60, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshDto: RefreshDto): Promise<LoginResponse> {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @Post('registro')
  @Throttle({ default: { ttl: 60, limit: 3 } })
  async registro(@Body() createUsuarioDto: CreateUsuarioDto) {
    const usuario = await this.usuariosService.create(createUsuarioDto);
    return {
      message: 'Usuario criado com sucesso',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('paciente-convite')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  async gerarConvitePaciente(
    @CurrentUser() usuario: Usuario,
    @Body() body: CreatePacienteInviteDto,
  ) {
    return this.authService.gerarConvitePaciente(
      usuario,
      body.pacienteId,
      body?.diasExpiracao,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('paciente-convite-rapido')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  async gerarConviteRapidoPaciente(
    @CurrentUser() usuario: Usuario,
    @Body() body: CreatePacienteConviteRapidoDto,
  ) {
    return this.authService.gerarConviteRapidoPaciente(usuario, body);
  }

  @Post('registro-paciente-convite')
  @Throttle({ default: { ttl: 60, limit: 10 } })
  async registroPacientePorConvite(
    @Body() dto: RegistroPacientePorConviteDto,
  ) {
    return this.authService.registrarPacientePorConvite(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('aceitar-paciente-convite')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.PACIENTE)
  async aceitarConvitePaciente(
    @CurrentUser() usuario: Usuario,
    @Body() dto: AceitarPacienteInviteDto,
  ) {
    return this.authService.aceitarConvitePaciente(usuario, dto.conviteToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() usuario: Usuario) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      conselhoSigla: usuario.conselhoSigla,
      conselhoUf: usuario.conselhoUf,
      conselhoProf: usuario.conselhoProf,
      registroProf: usuario.registroProf,
      especialidade: usuario.especialidade,
      role: usuario.role,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@CurrentUser() usuario: Usuario, @Body() dto: UpdateMeDto) {
    const updated = await this.usuariosService.updateMe(usuario.id, dto);
    return {
      id: updated.id,
      nome: updated.nome,
      email: updated.email,
      conselhoSigla: updated.conselhoSigla,
      conselhoUf: updated.conselhoUf,
      conselhoProf: updated.conselhoProf,
      registroProf: updated.registroProf,
      especialidade: updated.especialidade,
      role: updated.role,
    };
  }
}
