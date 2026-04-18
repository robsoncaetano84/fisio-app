import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario, UserRole } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { UpdateMeDto } from '../auth/dto/update-me.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    private readonly configService: ConfigService,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    const existingUser = await this.usuarioRepository.findOne({
      where: { email: createUsuarioDto.email },
    });

    if (existingUser) {
      throw new ConflictException('E-mail ja cadastrado');
    }

    const hashedPassword = await bcrypt.hash(createUsuarioDto.senha, 10);

    const allowAdmin =
      this.configService.get<string>('ALLOW_ADMIN_REGISTRATION') === 'true';
    const role =
      allowAdmin && createUsuarioDto.role === UserRole.ADMIN
        ? UserRole.ADMIN
        : createUsuarioDto.role === UserRole.PACIENTE
          ? UserRole.PACIENTE
          : UserRole.USER;

    const conselhoSigla = createUsuarioDto.conselhoSigla?.trim().toUpperCase();
    const conselhoUf = createUsuarioDto.conselhoUf?.trim().toUpperCase();
    const conselhoProf =
      createUsuarioDto.conselhoProf?.trim() ||
      (conselhoSigla && conselhoUf ? `${conselhoSigla}-${conselhoUf}` : undefined);

    const usuario = this.usuarioRepository.create({
      ...createUsuarioDto,
      conselhoSigla,
      conselhoUf,
      conselhoProf,
      role,
      senha: hashedPassword,
      consentTermsRequired:
        role === UserRole.PACIENTE
          ? !!createUsuarioDto.consentTermsRequired
          : false,
      consentPrivacyRequired:
        role === UserRole.PACIENTE
          ? !!createUsuarioDto.consentPrivacyRequired
          : false,
      consentResearchOptional:
        role === UserRole.PACIENTE
          ? !!createUsuarioDto.consentResearchOptional
          : false,
      consentAiOptional:
        role === UserRole.PACIENTE
          ? !!createUsuarioDto.consentAiOptional
          : false,
      consentAcceptedAt:
        ((role === UserRole.PACIENTE &&
          createUsuarioDto.consentTermsRequired &&
          createUsuarioDto.consentPrivacyRequired) ||
          (role !== UserRole.PACIENTE &&
            createUsuarioDto.consentProfessionalLgpdRequired)) 
          ? new Date()
          : null,
      consentProfessionalLgpdRequired:
        role !== UserRole.PACIENTE
          ? !!createUsuarioDto.consentProfessionalLgpdRequired
          : false,
    });

    return this.usuarioRepository.save(usuario);
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({ where: { email } });
  }

  async findPacienteByEmailForProfissional(
    profissionalId: string,
    email: string,
  ): Promise<Usuario | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return null;
    }

    return this.usuarioRepository
      .createQueryBuilder('usuario')
      .innerJoin(
        Paciente,
        'paciente',
        'paciente.pacienteUsuarioId = usuario.id AND paciente.usuarioId = :profissionalId AND paciente.ativo = :pacienteAtivo',
        { profissionalId, pacienteAtivo: true },
      )
      .where('usuario.ativo = :ativo', { ativo: true })
      .andWhere('usuario.role = :role', { role: UserRole.PACIENTE })
      .andWhere('LOWER(usuario.email) = :email', { email: normalizedEmail })
      .getOne();
  }

  async searchPacientesByTermForProfissional(
    profissionalId: string,
    term: string,
    limit = 10,
  ): Promise<Usuario[]> {
    const safeTerm = term.trim().toLowerCase();
    if (!safeTerm) {
      return [];
    }

    return this.usuarioRepository
      .createQueryBuilder('usuario')
      .innerJoin(
        Paciente,
        'paciente',
        'paciente.pacienteUsuarioId = usuario.id AND paciente.usuarioId = :profissionalId AND paciente.ativo = :pacienteAtivo',
        { profissionalId, pacienteAtivo: true },
      )
      .where('usuario.ativo = :ativo', { ativo: true })
      .andWhere('usuario.role = :role', { role: UserRole.PACIENTE })
      .andWhere(
        '(LOWER(usuario.nome) LIKE :term OR LOWER(usuario.email) LIKE :term)',
        { term: `%${safeTerm}%` },
      )
      .orderBy('usuario.nome', 'ASC')
      .distinct(true)
      .limit(Math.max(1, Math.min(20, limit)))
      .getMany();
  }

  async findById(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });

    if (!usuario) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return usuario;
  }

  async updateMe(usuarioId: string, dto: UpdateMeDto): Promise<Usuario> {
    const usuario = await this.findById(usuarioId);

    if (dto.nome !== undefined) {
      usuario.nome = dto.nome.trim();
    }

    const hasProfessionalField =
      dto.conselhoSigla !== undefined ||
      dto.conselhoUf !== undefined ||
      dto.registroProf !== undefined ||
      dto.especialidade !== undefined;

    const hasPatientConsentField =
      dto.consentResearchOptional !== undefined ||
      dto.consentAiOptional !== undefined;

    if (usuario.role === UserRole.PACIENTE && hasProfessionalField) {
      throw new BadRequestException(
        'Paciente nao pode atualizar dados profissionais',
      );
    }

    if (usuario.role !== UserRole.PACIENTE && hasPatientConsentField) {
      throw new BadRequestException(
        'Apenas pacientes podem atualizar consentimentos opcionais',
      );
    }

    if (usuario.role !== UserRole.PACIENTE && hasProfessionalField) {
      const conselhoSigla =
        dto.conselhoSigla !== undefined
          ? dto.conselhoSigla.trim().toUpperCase()
          : (usuario.conselhoSigla ?? '');
      const conselhoUf =
        dto.conselhoUf !== undefined
          ? dto.conselhoUf.trim().toUpperCase()
          : (usuario.conselhoUf ?? '');

      if (
        (dto.conselhoSigla !== undefined || dto.conselhoUf !== undefined) &&
        (!conselhoSigla || !conselhoUf)
      ) {
        throw new BadRequestException(
          'Conselho e UF devem ser informados juntos',
        );
      }

      if (dto.conselhoSigla !== undefined) {
        usuario.conselhoSigla = conselhoSigla || "";
      }
      if (dto.conselhoUf !== undefined) {
        usuario.conselhoUf = conselhoUf || "";
      }
      if (dto.registroProf !== undefined) {
        usuario.registroProf = dto.registroProf.trim() || "";
      }
      if (dto.especialidade !== undefined) {
        usuario.especialidade = dto.especialidade.trim() || "";
      }

      const finalSigla = usuario.conselhoSigla?.trim().toUpperCase();
      const finalUf = usuario.conselhoUf?.trim().toUpperCase();
      usuario.conselhoProf = finalSigla && finalUf ? `${finalSigla}-${finalUf}` : "";
    }

    if (usuario.role === UserRole.PACIENTE && hasPatientConsentField) {
      if (dto.consentResearchOptional !== undefined) {
        usuario.consentResearchOptional = dto.consentResearchOptional;
      }
      if (dto.consentAiOptional !== undefined) {
        usuario.consentAiOptional = dto.consentAiOptional;
      }
    }

    return this.usuarioRepository.save(usuario);
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
