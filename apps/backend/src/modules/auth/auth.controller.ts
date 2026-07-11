import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Patch,
  HttpCode,
  HttpStatus,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import type { AuthFeatureFlagsResponse, LoginResponse } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { CreatePacienteInviteDto } from './dto/create-paciente-invite.dto';
import { CreatePacienteConviteRapidoDto } from './dto/create-paciente-convite-rapido.dto';
import { RegistroPacientePorConviteDto } from './dto/registro-paciente-por-convite.dto';
import { AceitarPacienteInviteDto } from './dto/aceitar-paciente-convite.dto';
import { PacienteUsuarioQueryDto } from './dto/paciente-usuario-query.dto';
import { SearchPacienteUsuariosQueryDto } from './dto/search-paciente-usuarios-query.dto';
import { PacienteUsuarioResponseDto } from './dto/paciente-usuario-response.dto';
import { JwtAuthGuard, JwtAuthRolesGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { Roles } from './decorators/roles.decorator';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuariosService: UsuariosService,
  ) {}

  @Public()
  @Post('login')
  @Throttle({ default: { ttl: 60, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<LoginResponse> {
    const identificador = (
      loginDto.identificador ||
      loginDto.email ||
      ''
    ).trim();
    if (!identificador) {
      throw new BadRequestException('E-mail ou CPF é obrigatório');
    }
    return this.authService.login(identificador, loginDto.senha, {
      ip: req.ip,
    });
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { ttl: 60, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshDto: RefreshDto): Promise<LoginResponse> {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { ttl: 60, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Public()
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

  @UseGuards(JwtAuthRolesGuard)
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

  @Public()
  @Post('registro-paciente-convite')
  @Throttle({ default: { ttl: 60, limit: 10 } })
  async registroPacientePorConvite(@Body() dto: RegistroPacientePorConviteDto) {
    return this.authService.registrarPacientePorConvite(dto);
  }

  @Public()
  @Get('paciente-convite-dados')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  async obterDadosConvitePaciente(
    @Query('conviteToken') conviteToken?: string,
  ) {
    if (!conviteToken?.trim()) {
      throw new BadRequestException('Convite invalido');
    }
    return this.authService.obterDadosConvitePaciente(conviteToken.trim());
  }

  @UseGuards(JwtAuthRolesGuard)
  @Post('aceitar-paciente-convite')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.PACIENTE)
  async aceitarConvitePaciente(
    @CurrentUser() usuario: Usuario,
    @Body() dto: AceitarPacienteInviteDto,
  ) {
    return this.authService.aceitarConvitePaciente(usuario, dto.conviteToken);
  }

  @UseGuards(JwtAuthRolesGuard)
  @Post('logout')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() usuario: Usuario) {
    return this.authService.logout(usuario);
  }

  @UseGuards(JwtAuthRolesGuard)
  @Get('me')
  me(@CurrentUser() usuario: Usuario) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      conselhoSigla: usuario.conselhoSigla,
      conselhoUf: usuario.conselhoUf,
      conselhoProf: usuario.conselhoProf,
      registroProf: usuario.registroProf,
      especialidade: usuario.especialidade,
      consentTermsRequired: usuario.consentTermsRequired,
      consentPrivacyRequired: usuario.consentPrivacyRequired,
      consentResearchOptional: usuario.consentResearchOptional,
      consentAiOptional: usuario.consentAiOptional,
      consentAcceptedAt: usuario.consentAcceptedAt,
      consentProfessionalLgpdRequired: usuario.consentProfessionalLgpdRequired,
      role: usuario.role,
      featureFlags: this.authService.getFeatureFlagsForUser(usuario),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('feature-flags')
  getFeatureFlags(@CurrentUser() usuario: Usuario): AuthFeatureFlagsResponse {
    return this.authService.getFeatureFlagsForUser(usuario);
  }

  @UseGuards(JwtAuthRolesGuard)
  @Get('paciente-usuario')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async getPacienteUsuarioByEmail(
    @CurrentUser() usuario: Usuario,
    @Query() query: PacienteUsuarioQueryDto,
  ): Promise<PacienteUsuarioResponseDto | null> {
    const normalizedEmail = query.email.trim().toLowerCase();

    const pacienteUsuario =
      await this.usuariosService.findPacienteByEmailForProfissional(
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
      consentTermsRequired: updated.consentTermsRequired,
      consentPrivacyRequired: updated.consentPrivacyRequired,
      consentResearchOptional: updated.consentResearchOptional,
      consentAiOptional: updated.consentAiOptional,
      consentAcceptedAt: updated.consentAcceptedAt,
      consentProfessionalLgpdRequired: updated.consentProfessionalLgpdRequired,
      role: updated.role,
      featureFlags: this.authService.getFeatureFlagsForUser(updated),
    };
  }

  @UseGuards(JwtAuthRolesGuard)
  @Get('paciente-usuarios')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async searchPacienteUsuarios(
    @CurrentUser() usuario: Usuario,
    @Query() query: SearchPacienteUsuariosQueryDto,
  ): Promise<PacienteUsuarioResponseDto[]> {
    const usuarios =
      await this.usuariosService.searchPacientesByTermForProfissional(
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
