// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// P AC IE NT ES.S ER VI CE
// ==========================================
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from './entities/paciente.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { PacienteProfileResponseDto } from './dto/paciente-profile-response.dto';

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    @InjectRepository(Evolucao)
    private readonly evolucaoRepository: Repository<Evolucao>,
    @InjectRepository(Laudo)
    private readonly laudoRepository: Repository<Laudo>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  private async validatePacienteUsuarioId(
    pacienteUsuarioId: string | undefined,
    ignorePacienteId?: string,
  ): Promise<string | null> {
    if (!pacienteUsuarioId) {
      return null;
    }

    const usuarioPaciente = await this.usuarioRepository.findOne({
      where: { id: pacienteUsuarioId, ativo: true },
    });

    if (!usuarioPaciente) {
      throw new NotFoundException('Usuario do paciente nao encontrado');
    }

    if (usuarioPaciente.role !== UserRole.PACIENTE) {
      throw new ConflictException('Usuario informado nao possui perfil PACIENTE');
    }

    const existingLink = await this.pacienteRepository.findOne({
      where: { pacienteUsuarioId },
    });

    if (existingLink && existingLink.id !== ignorePacienteId) {
      throw new ConflictException('Este usuario paciente ja esta vinculado');
    }

    return pacienteUsuarioId;
  }

  async create(
    createPacienteDto: CreatePacienteDto,
    usuarioId: string,
  ): Promise<Paciente> {
    const existingPaciente = await this.pacienteRepository.findOne({
      where: { cpf: createPacienteDto.cpf },
    });

    if (existingPaciente) {
      throw new ConflictException('CPF ja cadastrado');
    }

    const pacienteUsuarioId = await this.validatePacienteUsuarioId(
      createPacienteDto.pacienteUsuarioId,
    );

    const paciente = this.pacienteRepository.create({
      ...createPacienteDto,
      usuarioId,
      pacienteUsuarioId,
    });

    return this.pacienteRepository.save(paciente);
  }

  async findAll(usuarioId: string): Promise<Paciente[]> {
    return this.pacienteRepository.find({
      where: { usuarioId, ativo: true },
      order: { nomeCompleto: 'ASC' },
    });
  }

  async findPaged(usuarioId: string, page: number, limit: number) {
    const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
    const safeLimit = Number.isFinite(limit)
      ? Math.min(100, Math.max(10, limit))
      : 30;
    const skip = (safePage - 1) * safeLimit;

    const [data, total] = await this.pacienteRepository.findAndCount({
      where: { usuarioId, ativo: true },
      order: { nomeCompleto: 'ASC' },
      take: safeLimit,
      skip,
    });

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      hasNext: skip + data.length < total,
    };
  }

  async findOne(id: string, usuarioId: string): Promise<Paciente> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id, usuarioId },
    });

    if (!paciente) {
      throw new NotFoundException('Paciente nao encontrado');
    }

    return paciente;
  }

  async update(
    id: string,
    updatePacienteDto: UpdatePacienteDto,
    usuarioId: string,
  ): Promise<Paciente> {
    const paciente = await this.findOne(id, usuarioId);

    if (updatePacienteDto.cpf && updatePacienteDto.cpf !== paciente.cpf) {
      const existingPaciente = await this.pacienteRepository.findOne({
        where: { cpf: updatePacienteDto.cpf },
      });

      if (existingPaciente) {
        throw new ConflictException('CPF ja cadastrado');
      }
    }

    if (Object.prototype.hasOwnProperty.call(updatePacienteDto, 'pacienteUsuarioId')) {
      const pacienteUsuarioId = await this.validatePacienteUsuarioId(
        updatePacienteDto.pacienteUsuarioId,
        paciente.id,
      );
      paciente.pacienteUsuarioId = pacienteUsuarioId;
    }

    Object.assign(paciente, updatePacienteDto);
    return this.pacienteRepository.save(paciente);
  }

  async remove(id: string, usuarioId: string): Promise<void> {
    const paciente = await this.findOne(id, usuarioId);
    paciente.ativo = false;
    await this.pacienteRepository.save(paciente);
  }

  async getAttentionMap(usuarioId: string): Promise<Record<string, number | null>> {
    const rows = await this.pacienteRepository
      .createQueryBuilder('p')
      .leftJoin(
        this.evolucaoRepository.metadata.tableName,
        'e',
        'e.paciente_id = p.id',
      )
      .where('p.usuario_id = :usuarioId', { usuarioId })
      .andWhere('p.ativo = :ativo', { ativo: true })
      .select('p.id', 'pacienteId')
      .addSelect('MAX(e.data)', 'lastEvolucaoAt')
      .groupBy('p.id')
      .getRawMany<{ pacienteId: string; lastEvolucaoAt: string | null }>();

    const now = Date.now();
    const result: Record<string, number | null> = {};

    for (const row of rows) {
      if (!row.lastEvolucaoAt) {
        result[row.pacienteId] = null;
        continue;
      }

      const latest = new Date(row.lastEvolucaoAt).getTime();
      if (Number.isNaN(latest)) {
        result[row.pacienteId] = null;
        continue;
      }

      result[row.pacienteId] = Math.floor((now - latest) / (1000 * 60 * 60 * 24));
    }

    return result;
  }

  async getStats(usuarioId: string) {
    const total = await this.pacienteRepository.count({
      where: { usuarioId, ativo: true },
    });

    return {
      totalPacientes: total,
      atendidosHoje: 0,
      atendidosMes: 0,
    };
  }

  async getMyPacienteProfile(
    usuario: Usuario,
  ): Promise<PacienteProfileResponseDto> {
    if (usuario.role !== UserRole.PACIENTE) {
      throw new ForbiddenException('Acesso permitido somente para pacientes');
    }

    const paciente = await this.pacienteRepository.findOne({
      where: { pacienteUsuarioId: usuario.id, ativo: true },
    });

    if (!paciente) {
      throw new NotFoundException('Nenhum cadastro de paciente vinculado');
    }

    const latestEvolucao = await this.evolucaoRepository.findOne({
      where: { pacienteId: paciente.id },
      order: { data: 'DESC' },
    });

    const latestLaudo = await this.laudoRepository.findOne({
      where: { pacienteId: paciente.id },
      order: { updatedAt: 'DESC' },
    });

    return {
      paciente,
      resumo: {
        ultimaEvolucaoEm: latestEvolucao?.data || null,
        ultimoLaudoAtualizadoEm: latestLaudo?.updatedAt || null,
        statusLaudo: latestLaudo?.status || null,
      },
    };
  }
}
