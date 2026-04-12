import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import {
  Paciente,
  PacienteCadastroOrigem,
  PacienteVinculoStatus,
} from './entities/paciente.entity';
import { PacienteExame } from './entities/paciente-exame.entity';
import {
  ProfissionalPacienteVinculo,
  ProfissionalPacienteVinculoOrigem,
  ProfissionalPacienteVinculoStatus,
} from './entities/profissional-paciente-vinculo.entity';
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
    @InjectRepository(PacienteExame)
    private readonly pacienteExameRepository: Repository<PacienteExame>,
    @InjectRepository(ProfissionalPacienteVinculo)
    private readonly vinculoRepository: Repository<ProfissionalPacienteVinculo>,
  ) {}

  private resolveInitialVinculoStatus(
    pacienteUsuarioId: string | null,
    cadastroOrigem?: PacienteCadastroOrigem,
  ): PacienteVinculoStatus {
    if (pacienteUsuarioId) {
      if (cadastroOrigem === PacienteCadastroOrigem.CONVITE_RAPIDO) {
        return PacienteVinculoStatus.VINCULADO_PENDENTE_COMPLEMENTO;
      }
      return PacienteVinculoStatus.VINCULADO;
    }
    return PacienteVinculoStatus.SEM_VINCULO;
  }

  private mapOrigemToVinculo(
    cadastroOrigem?: PacienteCadastroOrigem,
  ): ProfissionalPacienteVinculoOrigem {
    if (cadastroOrigem === PacienteCadastroOrigem.CONVITE_RAPIDO) {
      return ProfissionalPacienteVinculoOrigem.CONVITE_RAPIDO;
    }
    return ProfissionalPacienteVinculoOrigem.CADASTRO_ASSISTIDO;
  }

  private shouldReplaceQuickInviteName(nomeCompleto: string): boolean {
    const normalized = (nomeCompleto || '').trim().toLowerCase();
    return !normalized || normalized === 'paciente convite rapido';
  }

  private applyDisplayNameFallback(paciente: Paciente): Paciente {
    if (
      paciente.cadastroOrigem === PacienteCadastroOrigem.CONVITE_RAPIDO &&
      this.shouldReplaceQuickInviteName(paciente.nomeCompleto) &&
      paciente.pacienteUsuario?.nome
    ) {
      paciente.nomeCompleto = paciente.pacienteUsuario.nome;
    }
    return paciente;
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

    const existingAtivoByPacienteUsuario = await this.vinculoRepository.findOne({
      where: {
        pacienteUsuarioId,
        status: ProfissionalPacienteVinculoStatus.ATIVO,
      },
    });

    if (existingAtivoByPacienteUsuario) {
      if (existingAtivoByPacienteUsuario.pacienteId !== paciente.id) {
        throw new ConflictException('Este usuario paciente ja esta vinculado');
      }

      await this.vinculoRepository.update(
        { id: existingAtivoByPacienteUsuario.id },
        {
          profissionalId: paciente.usuarioId,
          origem: this.mapOrigemToVinculo(paciente.cadastroOrigem),
          endedAt: null,
        },
      );
      return;
    }

    await this.vinculoRepository.save(
      this.vinculoRepository.create({
        profissionalId: paciente.usuarioId,
        pacienteId: paciente.id,
        pacienteUsuarioId,
        status: ProfissionalPacienteVinculoStatus.ATIVO,
        origem: this.mapOrigemToVinculo(paciente.cadastroOrigem),
        endedAt: null,
      }),
    );
  }

  private async closeVinculoAtivoByPaciente(pacienteId: string): Promise<void> {
    await this.vinculoRepository.update(
      {
        pacienteId,
        status: ProfissionalPacienteVinculoStatus.ATIVO,
      },
      {
        status: ProfissionalPacienteVinculoStatus.ENCERRADO,
        endedAt: new Date(),
      },
    );
  }

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

    const existingActiveVinculo = await this.vinculoRepository.findOne({
      where: {
        pacienteUsuarioId,
        status: ProfissionalPacienteVinculoStatus.ATIVO,
      },
    });

    if (existingActiveVinculo && existingActiveVinculo.pacienteId !== ignorePacienteId) {
      throw new ConflictException('Este usuario paciente ja esta vinculado');
    }

    return pacienteUsuarioId;
  }

  async create(
    createPacienteDto: CreatePacienteDto,
    usuarioId: string,
  ): Promise<Paciente> {
    const existingPaciente = await this.pacienteRepository.findOne({
      where: { cpf: createPacienteDto.cpf, usuarioId },
    });

    if (existingPaciente) {
      throw new ConflictException('CPF ja cadastrado');
    }

    const pacienteUsuarioId = await this.validatePacienteUsuarioId(
      createPacienteDto.pacienteUsuarioId,
    );

    const cadastroOrigem =
      createPacienteDto.cadastroOrigem || PacienteCadastroOrigem.CADASTRO_ASSISTIDO;

    const paciente = this.pacienteRepository.create({
      ...createPacienteDto,
      cadastroOrigem,
      vinculoStatus: this.resolveInitialVinculoStatus(pacienteUsuarioId, cadastroOrigem),
      conviteEnviadoEm: null,
      conviteAceitoEm: pacienteUsuarioId ? new Date() : null,
      usuarioId,
      pacienteUsuarioId,
    });

    const saved = await this.pacienteRepository.save(paciente);

    if (saved.pacienteUsuarioId) {
      await this.upsertVinculoAtivo(saved, saved.pacienteUsuarioId);
    }

    return saved;
  }

  async findAll(usuarioId: string): Promise<Paciente[]> {
    const pacientes = await this.pacienteRepository.find({
      where: { usuarioId, ativo: true },
      order: { nomeCompleto: 'ASC' },
      relations: ['pacienteUsuario'],
    });
    return pacientes.map((paciente) => this.applyDisplayNameFallback(paciente));
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
      relations: ['pacienteUsuario'],
    });

    return {
      data: data.map((paciente) => this.applyDisplayNameFallback(paciente)),
      total,
      page: safePage,
      limit: safeLimit,
      hasNext: skip + data.length < total,
    };
  }

  async findOne(id: string, usuarioId: string): Promise<Paciente> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id, usuarioId },
      relations: ['pacienteUsuario'],
    });

    if (!paciente) {
      throw new NotFoundException('Paciente nao encontrado');
    }

    return this.applyDisplayNameFallback(paciente);
  }

  async update(
    id: string,
    updatePacienteDto: UpdatePacienteDto,
    usuarioId: string,
  ): Promise<Paciente> {
    const paciente = await this.findOne(id, usuarioId);

    if (updatePacienteDto.cpf && updatePacienteDto.cpf !== paciente.cpf) {
      const existingPaciente = await this.pacienteRepository.findOne({
        where: { cpf: updatePacienteDto.cpf, usuarioId },
      });

      if (existingPaciente) {
        throw new ConflictException('CPF ja cadastrado');
      }
    }

    let shouldSyncVinculo = false;
    if (Object.prototype.hasOwnProperty.call(updatePacienteDto, 'pacienteUsuarioId')) {
      const pacienteUsuarioId = await this.validatePacienteUsuarioId(
        updatePacienteDto.pacienteUsuarioId,
        paciente.id,
      );

      paciente.pacienteUsuarioId = pacienteUsuarioId;
      paciente.vinculoStatus = pacienteUsuarioId
        ? this.resolveInitialVinculoStatus(
            pacienteUsuarioId,
            paciente.cadastroOrigem || PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
          )
        : PacienteVinculoStatus.SEM_VINCULO;

      if (!pacienteUsuarioId) {
        paciente.conviteAceitoEm = null;
      } else if (!paciente.conviteAceitoEm) {
        paciente.conviteAceitoEm = new Date();
      }
      shouldSyncVinculo = true;
    }

    if (updatePacienteDto.cadastroOrigem) {
      paciente.cadastroOrigem = updatePacienteDto.cadastroOrigem;
      if (paciente.pacienteUsuarioId) {
        shouldSyncVinculo = true;
      }
    }

    if (updatePacienteDto.vinculoStatus) {
      paciente.vinculoStatus = updatePacienteDto.vinculoStatus;
    }

    if (updatePacienteDto.anamneseLiberadaPaciente === true) {
      paciente.anamneseSolicitacaoPendente = false;
      paciente.anamneseSolicitacaoEm = null;
    }

    Object.assign(paciente, updatePacienteDto);
    const saved = await this.pacienteRepository.save(paciente);

    if (shouldSyncVinculo) {
      if (saved.pacienteUsuarioId) {
        await this.upsertVinculoAtivo(saved, saved.pacienteUsuarioId);
      } else {
        await this.closeVinculoAtivoByPaciente(saved.id);
      }
    }

    return saved;
  }

  async unlinkPacienteUsuarioByProfessional(
    id: string,
    usuarioId: string,
  ): Promise<Paciente> {
    const paciente = await this.findOne(id, usuarioId);

    if (!paciente.pacienteUsuarioId) {
      throw new BadRequestException('Paciente nao possui usuario vinculado');
    }

    paciente.pacienteUsuarioId = null;
    paciente.vinculoStatus = PacienteVinculoStatus.SEM_VINCULO;
    paciente.conviteAceitoEm = null;
    const saved = await this.pacienteRepository.save(paciente);
    await this.closeVinculoAtivoByPaciente(saved.id);
    return saved;
  }

  async unlinkMyProfessional(usuario: Usuario): Promise<{ pacienteId: string }> {
    if (usuario.role !== UserRole.PACIENTE) {
      throw new ForbiddenException('Acesso permitido somente para pacientes');
    }

    const paciente = await this.findLinkedPacienteByUsuarioId(usuario.id);

    paciente.pacienteUsuarioId = null;
    paciente.vinculoStatus = PacienteVinculoStatus.SEM_VINCULO;
    paciente.conviteAceitoEm = null;
    await this.pacienteRepository.save(paciente);
    await this.closeVinculoAtivoByPaciente(paciente.id);

    return { pacienteId: paciente.id };
  }

  async requestAnamneseUnlock(
    usuario: Usuario,
  ): Promise<{ pacienteId: string; solicitadoEm: Date }> {
    if (usuario.role !== UserRole.PACIENTE) {
      throw new ForbiddenException('Acesso permitido somente para pacientes');
    }

    const paciente = await this.findLinkedPacienteByUsuarioId(usuario.id);

    if (paciente.anamneseLiberadaPaciente) {
      throw new BadRequestException('Anamnese ja liberada para preenchimento');
    }

    if (paciente.anamneseSolicitacaoPendente) {
      throw new ConflictException('Ja existe solicitacao pendente');
    }

    const now = new Date();
    if (paciente.anamneseSolicitacaoUltimaEm) {
      const elapsedMs = now.getTime() - new Date(paciente.anamneseSolicitacaoUltimaEm).getTime();
      const minCooldownMs = 24 * 60 * 60 * 1000;
      if (elapsedMs < minCooldownMs) {
        throw new BadRequestException('Aguarde 24h para nova solicitacao');
      }
    }

    paciente.anamneseSolicitacaoPendente = true;
    paciente.anamneseSolicitacaoEm = now;
    paciente.anamneseSolicitacaoUltimaEm = now;
    await this.pacienteRepository.save(paciente);

    return {
      pacienteId: paciente.id,
      solicitadoEm: now,
    };
  }
  async findLinkedPacienteByUsuarioId(usuarioId: string): Promise<Paciente> {
    const vinculoAtivo = await this.vinculoRepository.findOne({
      where: {
        pacienteUsuarioId: usuarioId,
        status: ProfissionalPacienteVinculoStatus.ATIVO,
      },
      order: { createdAt: 'DESC' },
    });

    if (vinculoAtivo) {
      const pacienteByVinculo = await this.pacienteRepository.findOne({
        where: { id: vinculoAtivo.pacienteId, ativo: true },
      });

      if (pacienteByVinculo) {
        return pacienteByVinculo;
      }
    }

    const paciente = await this.pacienteRepository.findOne({
      where: { pacienteUsuarioId: usuarioId, ativo: true },
    });

    if (!paciente) {
      throw new NotFoundException('Nenhum cadastro de paciente vinculado');
    }

    return paciente;
  }

  async remove(id: string, usuarioId: string): Promise<void> {
    const paciente = await this.findOne(id, usuarioId);
    paciente.ativo = false;
    await this.pacienteRepository.save(paciente);
    await this.closeVinculoAtivoByPaciente(paciente.id);
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

    let paciente: Paciente | null = null;
    try {
      paciente = await this.findLinkedPacienteByUsuarioId(usuario.id);
    } catch {
      paciente = null;
    }

    if (!paciente) {
      return {
        vinculado: false,
        paciente: null,
        resumo: null,
      };
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
      vinculado: true,
      paciente,
      resumo: {
        ultimaEvolucaoEm: latestEvolucao?.data || null,
        ultimoLaudoAtualizadoEm: latestLaudo?.updatedAt || null,
        statusLaudo: latestLaudo?.status || null,
      },
    };
  }

  async listExames(pacienteId: string, usuarioId: string): Promise<PacienteExame[]> {
    await this.findOne(pacienteId, usuarioId);
    return this.pacienteExameRepository.find({
      where: { pacienteId, usuarioId },
      order: { createdAt: 'DESC' },
    });
  }

  async createExame(
    pacienteId: string,
    usuarioId: string,
    payload: {
      nomeOriginal: string;
      nomeArquivo: string;
      mimeType: string;
      tamanhoBytes: number;
      caminhoArquivo: string;
      tipoExame?: string;
      observacao?: string;
      dataExame?: Date | null;
    },
  ): Promise<PacienteExame> {
    await this.findOne(pacienteId, usuarioId);
    const exame = this.pacienteExameRepository.create({
      pacienteId,
      usuarioId,
      nomeOriginal: payload.nomeOriginal,
      nomeArquivo: payload.nomeArquivo,
      mimeType: payload.mimeType,
      tamanhoBytes: payload.tamanhoBytes,
      caminhoArquivo: payload.caminhoArquivo,
      tipoExame: payload.tipoExame?.trim() || null,
      observacao: payload.observacao?.trim() || null,
      dataExame: payload.dataExame || null,
    });
    return this.pacienteExameRepository.save(exame);
  }

  async findExameOrFail(
    pacienteId: string,
    exameId: string,
    usuarioId: string,
  ): Promise<PacienteExame> {
    await this.findOne(pacienteId, usuarioId);
    const exame = await this.pacienteExameRepository.findOne({
      where: { id: exameId, pacienteId, usuarioId },
    });
    if (!exame) {
      throw new NotFoundException('Exame nao encontrado');
    }
    return exame;
  }

  async removeExame(
    pacienteId: string,
    exameId: string,
    usuarioId: string,
  ): Promise<void> {
    const exame = await this.findExameOrFail(pacienteId, exameId, usuarioId);
    await this.pacienteExameRepository.remove(exame);
    await fs.unlink(exame.caminhoArquivo).catch(() => undefined);
  }
}







