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
import {
  Paciente,
  PacienteCadastroOrigem,
  PacienteVinculoStatus,
  Sexo,
} from '../pacientes/entities/paciente.entity';
import {
  ProfissionalPacienteVinculo,
  ProfissionalPacienteVinculoOrigem,
  ProfissionalPacienteVinculoStatus,
} from '../pacientes/entities/profissional-paciente-vinculo.entity';
import { RegistroPacientePorConviteDto } from './dto/registro-paciente-por-convite.dto';
import { CreatePacienteConviteRapidoDto } from './dto/create-paciente-convite-rapido.dto';

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
    @InjectRepository(ProfissionalPacienteVinculo)
    private readonly vinculoRepository: Repository<ProfissionalPacienteVinculo>,
  ) {}

  private normalizeLoginIdentifier(identificador: string): string {
    return (identificador || '').trim().toLowerCase();
  }

  async validateUser(identificador: string, senha: string): Promise<Usuario | null> {
    const normalized = this.normalizeLoginIdentifier(identificador);

    let usuario: Usuario | null = null;
    if (normalized.includes('@')) {
      usuario = await this.usuariosService.findByEmail(normalized);
    } else {
      const cpfDigits = this.sanitizeDigits(normalized);
      if (cpfDigits.length === 11) {
        const paciente = await this.pacienteRepository.findOne({
          where: { cpf: cpfDigits, ativo: true },
          relations: { pacienteUsuario: true },
        });
        usuario = paciente?.pacienteUsuario ?? null;

        if (!usuario && paciente) {
          const vinculoAtivo = await this.vinculoRepository.findOne({
            where: {
              pacienteId: paciente.id,
              status: ProfissionalPacienteVinculoStatus.ATIVO,
            },
            order: { createdAt: 'DESC' },
          });

          if (vinculoAtivo) {
            try {
              usuario = await this.usuariosService.findById(vinculoAtivo.pacienteUsuarioId);
            } catch {
              usuario = null;
            }
          }
        }
      }

      if (!usuario) {
        usuario = await this.usuariosService.findByEmail(normalized);
      }
    }

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
    identificador: string,
    senha: string,
    meta?: { ip?: string },
  ): Promise<LoginResponse> {
    const normalizedIdentifier = this.normalizeLoginIdentifier(identificador);
    const isLocked = await this.lockoutService.isLocked(normalizedIdentifier);
    if (isLocked) {
      this.logger.warn(
        `Login bloqueado para ${normalizedIdentifier} (ip=${meta?.ip ?? 'unknown'})`,
      );
      this.logger.log(
        JSON.stringify({
          event: 'login',
          email: normalizedIdentifier,
          ip: meta?.ip ?? null,
          success: false,
          reason: 'LOCKED',
        }),
      );
      await this.authLogsService.record({
        email: normalizedIdentifier,
        eventType: AuthEventType.LOGIN,
        success: false,
        ip: meta?.ip,
        reason: 'LOCKED',
      });
      throw new UnauthorizedException('Conta temporariamente bloqueada');
    }

    const usuario = await this.validateUser(normalizedIdentifier, senha);

    if (!usuario) {
      await this.lockoutService.registerFailure(normalizedIdentifier);

      this.logger.warn(
        `Login falhou para ${normalizedIdentifier} (ip=${meta?.ip ?? 'unknown'})`,
      );
      this.logger.log(
        JSON.stringify({
          event: 'login',
          email: normalizedIdentifier,
          ip: meta?.ip ?? null,
          success: false,
          reason: 'INVALID_CREDENTIALS',
        }),
      );
      await this.authLogsService.record({
        email: normalizedIdentifier,
        eventType: AuthEventType.LOGIN,
        success: false,
        ip: meta?.ip,
        reason: 'INVALID_CREDENTIALS',
      });
      throw new UnauthorizedException('Credenciais invalidas');
    }

    await this.lockoutService.reset(normalizedIdentifier);
    this.logger.log(`Login ok para ${usuario.email} (ip=${meta?.ip ?? 'unknown'})`);
    this.logger.log(
      JSON.stringify({
        event: 'login',
        email: usuario.email,
        ip: meta?.ip ?? null,
        success: true,
      }),
    );
    await this.authLogsService.record({
      email: usuario.email,
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


  private mapPacienteOrigemToVinculoOrigem(
    paciente: Paciente,
  ): ProfissionalPacienteVinculoOrigem {
    if (paciente.cadastroOrigem === PacienteCadastroOrigem.CONVITE_RAPIDO) {
      return ProfissionalPacienteVinculoOrigem.CONVITE_RAPIDO;
    }
    return ProfissionalPacienteVinculoOrigem.CADASTRO_ASSISTIDO;
  }

  private async upsertVinculoAtivo(
    paciente: Paciente,
    pacienteUsuarioId: string,
  ): Promise<void> {
    await this.vinculoRepository.update(
      {
        pacienteId: paciente.id,
        status: ProfissionalPacienteVinculoStatus.ATIVO,
      },
      {
        status: ProfissionalPacienteVinculoStatus.ENCERRADO,
        endedAt: new Date(),
      },
    );

    await this.vinculoRepository.update(
      {
        pacienteUsuarioId,
        status: ProfissionalPacienteVinculoStatus.ATIVO,
      },
      {
        status: ProfissionalPacienteVinculoStatus.ENCERRADO,
        endedAt: new Date(),
      },
    );

    await this.vinculoRepository.save(
      this.vinculoRepository.create({
        profissionalId: paciente.usuarioId,
        pacienteId: paciente.id,
        pacienteUsuarioId,
        status: ProfissionalPacienteVinculoStatus.ATIVO,
        origem: this.mapPacienteOrigemToVinculoOrigem(paciente),
        endedAt: null,
      }),
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
        pacienteParaVinculo.vinculoStatus =
          pacienteParaVinculo.cadastroOrigem === PacienteCadastroOrigem.CONVITE_RAPIDO
            ? PacienteVinculoStatus.VINCULADO_PENDENTE_COMPLEMENTO
            : PacienteVinculoStatus.VINCULADO;
        if (!pacienteParaVinculo.conviteAceitoEm) {
          pacienteParaVinculo.conviteAceitoEm = new Date();
        }
        await this.pacienteRepository.save(pacienteParaVinculo);
        await this.upsertVinculoAtivo(pacienteParaVinculo, pacienteUsuario.id);
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

    const vinculoAtivoTabela = await this.vinculoRepository.findOne({
      where: {
        pacienteUsuarioId: pacienteUsuario.id,
        status: ProfissionalPacienteVinculoStatus.ATIVO,
      },
    });

    if (vinculoAtivoTabela && vinculoAtivoTabela.pacienteId !== pacienteParaVinculo.id) {
      throw new BadRequestException('Usuario paciente ja vinculado a outro cadastro');
    }

    pacienteParaVinculo.pacienteUsuarioId = pacienteUsuario.id;
    pacienteParaVinculo.vinculoStatus =
      pacienteParaVinculo.cadastroOrigem === PacienteCadastroOrigem.CONVITE_RAPIDO
        ? PacienteVinculoStatus.VINCULADO_PENDENTE_COMPLEMENTO
        : PacienteVinculoStatus.VINCULADO;
    pacienteParaVinculo.conviteAceitoEm = new Date();
    await this.pacienteRepository.save(pacienteParaVinculo);
    await this.upsertVinculoAtivo(pacienteParaVinculo, pacienteUsuario.id);
  }

  private sanitizeDigits(value?: string): string {
    return (value || '').replace(/\D/g, '').trim();
  }

  private async generateUniquePacienteCpf(): Promise<string> {
    for (let i = 0; i < 25; i++) {
      const base = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const cpf = base.slice(-11).padStart(11, '0');
      const exists = await this.pacienteRepository.findOne({ where: { cpf } });
      if (!exists) return cpf;
    }
    throw new BadRequestException('Nao foi possivel gerar CPF temporario para convite rapido');
  }

  async gerarConviteRapidoPaciente(
    profissional: Usuario,
    dto: CreatePacienteConviteRapidoDto,
  ): Promise<{
    pacienteId: string;
    token: string;
    link: string;
    expiraEmDias: number;
  }> {
    if (
      profissional.role !== UserRole.ADMIN &&
      profissional.role !== UserRole.USER
    ) {
      throw new ForbiddenException('Apenas profissionais podem gerar convite');
    }

    const whatsappDigits = this.sanitizeDigits(dto.whatsapp);
    const email = dto.email?.trim().toLowerCase() || '';

    if (!whatsappDigits && !email) {
      throw new BadRequestException('Informe WhatsApp ou e-mail para envio do convite');
    }

    const cpfTemporario = await this.generateUniquePacienteCpf();
    const nomeBase = dto.nome?.trim() || 'Paciente convite rapido';

    const draftPaciente: Partial<Paciente> = {
      usuarioId: profissional.id,
      nomeCompleto: nomeBase,
      cpf: cpfTemporario,
      dataNascimento: new Date('1900-01-01'),
      sexo: Sexo.OUTRO,
      profissao: '',
      enderecoRua: '-',
      enderecoNumero: '-',
      enderecoBairro: '-',
      enderecoCep: '00000000',
      enderecoCidade: '-',
      enderecoUf: 'NA',
      contatoWhatsapp: whatsappDigits || '0000000000',
      contatoEmail: email || undefined,
      cadastroOrigem: PacienteCadastroOrigem.CONVITE_RAPIDO,
      vinculoStatus: PacienteVinculoStatus.SEM_VINCULO,
      anamneseLiberadaPaciente: false,
      pacienteUsuarioId: null,
      conviteEnviadoEm: null,
      conviteAceitoEm: null,
      ativo: true,
    };

    const saved = await this.pacienteRepository.save(
      this.pacienteRepository.create(draftPaciente),
    );
    const invite = await this.gerarConvitePaciente(
      profissional,
      saved.id,
      dto.diasExpiracao,
    );

    return {
      pacienteId: saved.id,
      token: invite.token,
      link: invite.link,
      expiraEmDias: invite.expiraEmDias,
    };
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

    paciente.vinculoStatus = PacienteVinculoStatus.CONVITE_ENVIADO;
    paciente.conviteEnviadoEm = new Date();
    await this.pacienteRepository.save(paciente);

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



















