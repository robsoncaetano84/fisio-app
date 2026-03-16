import {
  Injectable,
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

    const usuario = this.usuarioRepository.create({
      ...createUsuarioDto,
      role,
      senha: hashedPassword,
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

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
