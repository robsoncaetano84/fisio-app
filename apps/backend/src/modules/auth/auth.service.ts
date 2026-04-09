// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// A UT H.S ER VI CE
// ==========================================
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AuthLogsService } from './auth-logs.service';
import { AuthEventType } from './entities/auth-log.entity';
import { LockoutService } from './lockout.service';
import { UserRole } from '../usuarios/entities/usuario.entity';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { RegistroPacientePorConviteDto } from './dto/registro-paciente-por-convite.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

type InvitePayload = {
  sub: string;
  pacienteId: string;
  type: 'PACIENTE_INVITE';
};

export interface LoginResponse {
  token: string;
  refreshToken: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    conselhoSigla: string;
    conselhoUf: string;
    conselhoProf: string;
    registroProf: string;
    especialidade: string;
    role: UserRole;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authLogsService: AuthLogsService,
    private readonly lockoutService: LockoutService,
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
  ) {}

  async validateUser(email: string, senha: string): Promise<Usuario | null> {
    const usuario = await this.usuariosService.findByEmail(email);

    if (!usuario || !usuario.ativo) {
      return null;
    }

    const isPasswordValid = await this.usuariosService.validatePassword(
      senha,
      usuario.senha,
    );

    if (!isPasswordValid) {
      return null;
    }

    return usuario;
  }

  private signAccessToken(payload: JwtPayload): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN');
    return this.jwtService.sign(payload, {
      secret,
      expiresIn: expiresIn as SignOptions['expiresIn'],
    });
  }

  private signRefreshToken(payload: JwtPayload): string {
    const secret = this.configService.get<string>('REFRESH_SECRET');
    const expiresIn = this.configService.get<string>('REFRESH_EXPIRES_IN');
    return this.jwtService.sign(payload, {
      secret,
      expiresIn: expiresIn as SignOptions['expiresIn'],
    });
  }

  private buildLoginResponse(usuario: Usuario): LoginResponse {
    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
    };

    return {
      token: this.signAccessToken(payload),
      refreshToken: this.signRefreshToken(payload),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        conselhoSigla: usuario.conselhoSigla,
        conselhoUf: usuario.conselhoUf,
        conselhoProf: usuario.conselhoProf,
        registroProf: usuario.registroProf,
        especialidade: usuario.especialidade,
        role: usuario.role,
      },
    };
  }

  async login(
    email: string,
    senha: string,
    meta?: { ip?: string },
  ): Promise<LoginResponse> {
    const isLocked = await this.lockoutService.isLocked(email);
    if (isLocked) {
      this.logger.warn(
        `Login bloqueado para ${email} (ip=${meta?.ip ?? 'unknown'})`,
      );
      this.logger.log(
        JSON.stringify({
          event: 'login',
          email,
          ip: meta?.ip ?? null,
          success: false,
          reason: 'LOCKED',
        }),
      );
      await this.authLogsService.record({
        email,
        eventType: AuthEventType.LOGIN,
        success: false,
        ip: meta?.ip,
        reason: 'LOCKED',
      });
      throw new UnauthorizedException('Conta temporariamente bloqueada');
    }

    const usuario = await this.validateUser(email, senha);

    if (!usuario) {
      await this.lockoutService.registerFailure(email);

      this.logger.warn(
        `Login falhou para ${email} (ip=${meta?.ip ?? 'unknown'})`,
      );
      this.logger.log(
        JSON.stringify({
          event: 'login',
          email,
          ip: meta?.ip ?? null,
          success: false,
          reason: 'INVALID_CREDENTIALS',
        }),
      );
      await this.authLogsService.record({
        email,
        eventType: AuthEventType.LOGIN,
        success: false,
        ip: meta?.ip,
        reason: 'INVALID_CREDENTIALS',
      });
      throw new UnauthorizedException('Credenciais invalidas');
    }

    await this.lockoutService.reset(email);
    this.logger.log(`Login ok para ${email} (ip=${meta?.ip ?? 'unknown'})`);
    this.logger.log(
      JSON.stringify({
        event: 'login',
        email,
        ip: meta?.ip ?? null,
        success: true,
      }),
    );
    await this.authLogsService.record({
      email,
      usuarioId: usuario.id,
      eventType: AuthEventType.LOGIN,
      success: true,
      ip: meta?.ip,
    });

    return this.buildLoginResponse(usuario);
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    try {
      const secret = this.configService.get<string>('REFRESH_SECRET');
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret,
      });

      const usuario = await this.usuariosService.findById(payload.sub);
      if (!usuario || !usuario.ativo) {
        throw new UnauthorizedException('Usuario invalido');
      }

      this.logger.log(`Refresh token ok para ${usuario.email}`);
      this.logger.log(
        JSON.stringify({
          event: 'refresh',
          email: usuario.email,
          success: true,
        }),
      );
      await this.authLogsService.record({
        email: usuario.email,
        usuarioId: usuario.id,
        eventType: AuthEventType.REFRESH,
        success: true,
      });
      return this.buildLoginResponse(usuario);
    } catch (error) {
      this.logger.warn('Refresh token invalido');
      this.logger.log(
        JSON.stringify({
          event: 'refresh',
          email: 'unknown',
          success: false,
          reason: 'INVALID_REFRESH',
        }),
      );
      await this.authLogsService.record({
        email: 'unknown',
        eventType: AuthEventType.REFRESH,
        success: false,
        reason: 'INVALID_REFRESH',
      });
      throw new UnauthorizedException('Refresh token invalido');
    }
  }

  private getInviteSecret(): string {
    return (
      this.configService.get<string>('INVITE_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'invite-default-secret'
    );
  }

  private async resolveInviteContext(
    conviteToken: string,
  ): Promise<{ profissional: Usuario; pacienteParaVinculo: Paciente }> {
    let payload: InvitePayload;
    try {
      payload = this.jwtService.verify<InvitePayload>(conviteToken, {
        secret: this.getInviteSecret(),
      });
    } catch {
      throw new BadRequestException('Convite invalido ou expirado');
    }

    if (!payload?.sub || !payload?.pacienteId || payload.type !== 'PACIENTE_INVITE') {
      throw new BadRequestException('Convite invalido');
    }

    const profissional = await this.usuariosService.findById(payload.sub);
    if (
      !profissional.ativo ||
      (profissional.role !== UserRole.ADMIN &&
        profissional.role !== UserRole.USER)
    ) {
      throw new BadRequestException('Profissional do convite nao encontrado');
    }

    const pacienteParaVinculo = await this.pacienteRepository.findOne({
      where: {
        id: payload.pacienteId,
        usuarioId: profissional.id,
        ativo: true,
      },
    });

    if (!pacienteParaVinculo) {
      throw new BadRequestException('Paciente do convite nao encontrado');
    }

    return { profissional, pacienteParaVinculo };
  }

  private async vincularPacienteUsuarioAoCadastro(
    pacienteParaVinculo: Paciente,
    pacienteUsuario: Usuario,
  ): Promise<void> {
    if (pacienteParaVinculo.pacienteUsuarioId) {
      if (pacienteParaVinculo.pacienteUsuarioId === pacienteUsuario.id) {
        return;
      }
      throw new BadRequestException('Paciente ja possui usuario vinculado');
    }

    const vinculoExistente = await this.pacienteRepository.findOne({
      where: { pacienteUsuarioId: pacienteUsuario.id },
    });

    if (vinculoExistente && vinculoExistente.id !== pacienteParaVinculo.id) {
      throw new BadRequestException('Usuario paciente ja vinculado a outro cadastro');
    }

    pacienteParaVinculo.pacienteUsuarioId = pacienteUsuario.id;
    await this.pacienteRepository.save(pacienteParaVinculo);
  }

  async gerarConvitePaciente(
    profissional: Usuario,
    pacienteId: string,
    diasExpiracao?: number,
  ): Promise<{ token: string; link: string; expiraEmDias: number }> {
    if (
      profissional.role !== UserRole.ADMIN &&
      profissional.role !== UserRole.USER
    ) {
      throw new ForbiddenException('Apenas profissionais podem gerar convite');
    }

    const paciente = await this.pacienteRepository.findOne({
      where: { id: pacienteId, usuarioId: profissional.id, ativo: true },
    });

    if (!paciente) {
      throw new BadRequestException('Paciente do convite nao encontrado');
    }

    if (paciente.pacienteUsuarioId) {
      throw new BadRequestException('Paciente ja possui usuario vinculado');
    }

    const expiraEmDias = Math.min(Math.max(diasExpiracao ?? 7, 1), 30);
    const inviteBaseUrl =
      this.configService.get<string>('PATIENT_INVITE_BASE_URL') ||
      'synap://cadastro-paciente';

    const token = this.jwtService.sign(
      {
        sub: profissional.id,
        pacienteId: paciente.id,
        type: 'PACIENTE_INVITE',
      } satisfies InvitePayload,
      {
        secret: this.getInviteSecret(),
        expiresIn: `${expiraEmDias}d` as SignOptions['expiresIn'],
      },
    );

    const sep = inviteBaseUrl.includes('?') ? '&' : '?';
    const link = `${inviteBaseUrl}${sep}convite=${encodeURIComponent(token)}`;

    return { token, link, expiraEmDias };
  }

  async aceitarConvitePaciente(
    pacienteUsuario: Usuario,
    conviteToken: string,
  ): Promise<{
    vinculadoAutomaticamente: boolean;
    pacienteId: string;
    profissionalId: string;
  }> {
    if (pacienteUsuario.role !== UserRole.PACIENTE || !pacienteUsuario.ativo) {
      throw new ForbiddenException('Apenas pacientes autenticados podem aceitar o convite');
    }

    const { profissional, pacienteParaVinculo } = await this.resolveInviteContext(
      conviteToken,
    );

    await this.vincularPacienteUsuarioAoCadastro(
      pacienteParaVinculo,
      pacienteUsuario,
    );

    return {
      vinculadoAutomaticamente: true,
      pacienteId: pacienteParaVinculo.id,
      profissionalId: profissional.id,
    };
  }

  async registrarPacientePorConvite(
    dto: RegistroPacientePorConviteDto,
  ): Promise<
    LoginResponse & {
      vinculadoAutomaticamente: boolean;
      pacienteId: string | null;
      profissionalId: string;
    }
  > {
    const { profissional, pacienteParaVinculo } = await this.resolveInviteContext(
      dto.conviteToken,
    );

    const createUsuarioDto: CreateUsuarioDto = {
      nome: dto.nome.trim(),
      email: dto.email.trim().toLowerCase(),
      senha: dto.senha,
      role: UserRole.PACIENTE,
    };

    const pacienteUsuario = await this.usuariosService.create(createUsuarioDto);

    await this.vincularPacienteUsuarioAoCadastro(
      pacienteParaVinculo,
      pacienteUsuario,
    );
    const pacienteId: string | null = pacienteParaVinculo.id;

    const loginResponse = this.buildLoginResponse(pacienteUsuario);

    return {
      ...loginResponse,
      vinculadoAutomaticamente: true,
      pacienteId,
      profissionalId: profissional.id,
    };
  }
}

