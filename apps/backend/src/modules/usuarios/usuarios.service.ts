// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// U SU AR IO S.S ER VI CE
// ==========================================
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

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly configService: ConfigService,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    const existingUser = await this.usuarioRepository.findOne({
      where: { email: createUsuarioDto.email },
    });

    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
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

  async findPacienteByEmail(email: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { email, role: UserRole.PACIENTE, ativo: true },
    });
  }

  async searchPacientesByTerm(term: string, limit = 10): Promise<Usuario[]> {
    const safeTerm = term.trim().toLowerCase();
    if (!safeTerm) {
      return [];
    }

    return this.usuarioRepository
      .createQueryBuilder('usuario')
      .where('usuario.ativo = :ativo', { ativo: true })
      .andWhere('usuario.role = :role', { role: UserRole.PACIENTE })
      .andWhere(
        '(LOWER(usuario.nome) LIKE :term OR LOWER(usuario.email) LIKE :term)',
        { term: `%${safeTerm}%` },
      )
      .orderBy('usuario.nome', 'ASC')
      .limit(Math.max(1, Math.min(20, limit)))
      .getMany();
  }

  async findById(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
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
