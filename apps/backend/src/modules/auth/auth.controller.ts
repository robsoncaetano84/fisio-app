import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService, LoginResponse } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { PacienteUsuarioQueryDto } from './dto/paciente-usuario-query.dto';
import { SearchPacienteUsuariosQueryDto } from './dto/search-paciente-usuarios-query.dto';
import { PacienteUsuarioResponseDto } from './dto/paciente-usuario-response.dto';
import { CreatePacienteInviteDto } from './dto/create-paciente-invite.dto';
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
      registroProf: usuario.registroProf,
      especialidade: usuario.especialidade,
      role: usuario.role,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('paciente-usuario')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async getPacienteUsuarioByEmail(
    @CurrentUser() usuario: Usuario,
    @Query() query: PacienteUsuarioQueryDto,
  ): Promise<PacienteUsuarioResponseDto | null> {
    const normalizedEmail = query.email.trim().toLowerCase();

    const pacienteUsuario = await this.usuariosService.findPacienteByEmailForProfissional(
      usuario.id,
      normalizedEmail,
    );
    if (!pacienteUsuario) {
      return null;
    }

    return {
      id: pacienteUsuario.id,
      nome: pacienteUsuario.nome,
      email: pacienteUsuario.email,
      role: pacienteUsuario.role,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('paciente-usuarios')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async searchPacienteUsuarios(
    @CurrentUser() usuario: Usuario,
    @Query() query: SearchPacienteUsuariosQueryDto,
  ): Promise<PacienteUsuarioResponseDto[]> {
    const usuarios = await this.usuariosService.searchPacientesByTermForProfissional(
      usuario.id,
      query.query,
      query.limit ?? 10,
    );
    return usuarios.map((pacienteUsuario) => ({
      id: pacienteUsuario.id,
      nome: pacienteUsuario.nome,
      email: pacienteUsuario.email,
      role: pacienteUsuario.role,
    }));
  }
}
