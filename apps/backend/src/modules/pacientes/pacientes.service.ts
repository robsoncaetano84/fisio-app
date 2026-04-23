import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  Paciente,
  PacienteCadastroOrigem,
  PacienteVinculoStatus,
  Sexo,
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
import {
  PacienteListItemDto,
  PacienteCicloStatus,
  PacientePagedResponseDto,
} from './dto/paciente-list-item.dto';
import { Atividade } from '../atividades/entities/atividade.entity';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { LaudoStatus } from '../laudos/entities/laudo.entity';

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
    @InjectRepository(Atividade)
    private readonly atividadeRepository: Repository<Atividade>,
    @InjectRepository(Anamnese)
    private readonly anamneseRepository: Repository<Anamnese>,
  ) {}

  private buildScopedPacientesQuery(usuarioId: string) {
    const vinculoTable = this.vinculoRepository.metadata.tableName;
    return this.pacienteRepository
      .createQueryBuilder('p')
      .where('p.ativo = :ativo', { ativo: true })
      .andWhere(
        `((p.usuario_id = :usuarioId AND p.paciente_usuario_id IS NULL) OR EXISTS (
          SELECT 1
          FROM ${vinculoTable} v
          WHERE v.paciente_id = p.id
            AND v.profissional_id = :usuarioId
            AND v.status = :vinculoStatusAtivo
        ))`,
        {
          usuarioId,
          vinculoStatusAtivo: ProfissionalPacienteVinculoStatus.ATIVO,
        },
      );
  }

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

  private addPacienteListSelects(query: SelectQueryBuilder<Paciente>) {
    return query
      .select([
        'p.id',
        'p.nomeCompleto',
        'p.cpf',
        'p.rg',
        'p.dataNascimento',
        'p.sexo',
        'p.estadoCivil',
        'p.profissao',
        'p.enderecoRua',
        'p.enderecoNumero',
        'p.enderecoComplemento',
        'p.enderecoBairro',
        'p.enderecoCep',
        'p.enderecoCidade',
        'p.enderecoUf',
        'p.contatoWhatsapp',
        'p.contatoTelefone',
        'p.contatoEmail',
        'p.ativo',
        'p.usuarioId',
        'p.pacienteUsuarioId',
        'p.anamneseLiberadaPaciente',
        'p.anamneseSolicitacaoPendente',
        'p.anamneseSolicitacaoEm',
        'p.anamneseSolicitacaoUltimaEm',
        'p.cadastroOrigem',
        'p.vinculoStatus',
        'p.conviteEnviadoEm',
        'p.conviteAceitoEm',
        'p.createdAt',
        'p.updatedAt',
      ])
      .leftJoin('p.pacienteUsuario', 'pacienteUsuario')
      .addSelect(['pacienteUsuario.id', 'pacienteUsuario.nome']);
  }

  private toPacienteListItem(
    paciente: Paciente,
    statusCiclo: PacienteCicloStatus = PacienteCicloStatus.AGUARDANDO_ANAMNESE,
  ): PacienteListItemDto {
    return {
      id: paciente.id,
      nomeCompleto: paciente.nomeCompleto,
      cpf: paciente.cpf,
      rg: paciente.rg || null,
      dataNascimento: paciente.dataNascimento,
      sexo: paciente.sexo,
      estadoCivil: paciente.estadoCivil || null,
      profissao: paciente.profissao || null,
      enderecoRua: paciente.enderecoRua,
      enderecoNumero: paciente.enderecoNumero,
      enderecoComplemento: paciente.enderecoComplemento || null,
      enderecoBairro: paciente.enderecoBairro,
      enderecoCep: paciente.enderecoCep,
      enderecoCidade: paciente.enderecoCidade,
      enderecoUf: paciente.enderecoUf,
      contatoWhatsapp: paciente.contatoWhatsapp,
      contatoTelefone: paciente.contatoTelefone || null,
      contatoEmail: paciente.contatoEmail || null,
      ativo: paciente.ativo,
      usuarioId: paciente.usuarioId,
      pacienteUsuarioId: paciente.pacienteUsuarioId || null,
      anamneseLiberadaPaciente: paciente.anamneseLiberadaPaciente,
      anamneseSolicitacaoPendente: paciente.anamneseSolicitacaoPendente,
      anamneseSolicitacaoEm: paciente.anamneseSolicitacaoEm || null,
      anamneseSolicitacaoUltimaEm:
        paciente.anamneseSolicitacaoUltimaEm || null,
      cadastroOrigem: paciente.cadastroOrigem,
      vinculoStatus: paciente.vinculoStatus,
      statusCiclo,
      conviteEnviadoEm: paciente.conviteEnviadoEm || null,
      conviteAceitoEm: paciente.conviteAceitoEm || null,
      createdAt: paciente.createdAt,
      updatedAt: paciente.updatedAt,
    };
  }

  private async buildCicloStatusByPacienteIds(
    pacienteIds: string[],
  ): Promise<Map<string, PacienteCicloStatus>> {
    const statusByPaciente = new Map<string, PacienteCicloStatus>();
    if (!pacienteIds.length) return statusByPaciente;

    const anamneseRows = await this.anamneseRepository
      .createQueryBuilder('a')
      .select('a.pacienteId', 'pacienteId')
      .where('a.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .groupBy('a.pacienteId')
      .getRawMany<{ pacienteId: string }>();
    const anamnesePacienteIds = new Set(anamneseRows.map((row) => row.pacienteId));

    const latestLaudos = await this.laudoRepository
      .createQueryBuilder('l')
      .where('l.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .orderBy('l.pacienteId', 'ASC')
      .addOrderBy('l.updatedAt', 'DESC')
      .getMany();
    const laudoByPaciente = new Map<string, Laudo>();
    latestLaudos.forEach((item) => {
      if (!laudoByPaciente.has(item.pacienteId)) laudoByPaciente.set(item.pacienteId, item);
    });

    const pacientesComAtividadeAtiva = await this.atividadeRepository
      .createQueryBuilder('a')
      .select('a.pacienteId', 'pacienteId')
      .where('a.ativo = :ativo', { ativo: true })
      .andWhere('a.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .groupBy('a.pacienteId')
      .getRawMany<{ pacienteId: string }>();
    const atividadePacienteIds = new Set(
      pacientesComAtividadeAtiva.map((row) => row.pacienteId),
    );

    for (const pacienteId of pacienteIds) {
      const hasAnamnese = anamnesePacienteIds.has(pacienteId);
      const lastLaudo = laudoByPaciente.get(pacienteId);
      const hasAltaDocumento =
        lastLaudo?.status === LaudoStatus.VALIDADO_PROFISSIONAL &&
        !!lastLaudo.criteriosAlta;
      const hasActiveActivity = atividadePacienteIds.has(pacienteId);
      const tratamentoConcluido = hasAltaDocumento && !hasActiveActivity;

      if (tratamentoConcluido) {
        statusByPaciente.set(pacienteId, PacienteCicloStatus.ALTA_CONCLUIDA);
      } else if (hasAnamnese) {
        statusByPaciente.set(pacienteId, PacienteCicloStatus.EM_TRATAMENTO);
      } else {
        statusByPaciente.set(pacienteId, PacienteCicloStatus.AGUARDANDO_ANAMNESE);
      }
    }

    return statusByPaciente;
  }

  private async upsertVinculoAtivo(
    paciente: Paciente,
    pacienteUsuarioId: string,
  ): Promise<void> {
    await this.vinculoRepository.manager.transaction(async (manager) => {
      const vinculoRepo = manager.getRepository(ProfissionalPacienteVinculo);

      await vinculoRepo.update(
        {
          pacienteId: paciente.id,
          status: ProfissionalPacienteVinculoStatus.ATIVO,
        },
        {
          status: ProfissionalPacienteVinculoStatus.ENCERRADO,
          endedAt: new Date(),
        },
      );

      const existingAtivoByPacienteUsuario = await vinculoRepo.findOne({
        where: {
          pacienteUsuarioId,
          status: ProfissionalPacienteVinculoStatus.ATIVO,
        },
      });

      if (existingAtivoByPacienteUsuario) {
        if (existingAtivoByPacienteUsuario.pacienteId !== paciente.id) {
          throw new ConflictException('Este usuario paciente ja esta vinculado');
        }

        await vinculoRepo.update(
          { id: existingAtivoByPacienteUsuario.id },
          {
            profissionalId: paciente.usuarioId,
            origem: this.mapOrigemToVinculo(paciente.cadastroOrigem),
            endedAt: null,
          },
        );
        return;
      }

      await vinculoRepo.save(
        vinculoRepo.create({
          profissionalId: paciente.usuarioId,
          pacienteId: paciente.id,
          pacienteUsuarioId,
          status: ProfissionalPacienteVinculoStatus.ATIVO,
          origem: this.mapOrigemToVinculo(paciente.cadastroOrigem),
          endedAt: null,
        }),
      );
    });
  }

  private async closeVinculoAtivoByPaciente(pacienteId: string): Promise<void> {
    await this.vinculoRepository.manager.transaction(async (manager) => {
      await manager.getRepository(ProfissionalPacienteVinculo).update(
        {
          pacienteId,
          status: ProfissionalPacienteVinculoStatus.ATIVO,
        },
        {
          status: ProfissionalPacienteVinculoStatus.ENCERRADO,
          endedAt: new Date(),
        },
      );
    });
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
      const isPacienteAutonomo =
        existingLink.ativo && existingLink.usuarioId === pacienteUsuarioId;
      if (!isPacienteAutonomo) {
        throw new ConflictException('Este usuario paciente ja esta vinculado');
      }
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

  private async generateUniquePacienteCpf(): Promise<string> {
    for (let i = 0; i < 25; i++) {
      const base = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const cpf = base.slice(-11).padStart(11, '0');
      const exists = await this.pacienteRepository.findOne({ where: { cpf } });
      if (!exists) return cpf;
    }
    throw new BadRequestException(
      'Nao foi possivel gerar CPF temporario para paciente',
    );
  }

  async findOrCreateSelfPacienteForUsuario(usuarioId: string): Promise<Paciente> {
    const existente = await this.pacienteRepository.findOne({
      where: { pacienteUsuarioId: usuarioId, ativo: true },
      order: { createdAt: 'DESC' },
    });
    if (existente) {
      return existente;
    }

    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId, ativo: true },
    });

    if (!usuario || usuario.role !== UserRole.PACIENTE) {
      throw new NotFoundException('Usuario paciente nao encontrado');
    }

    const cpfTemporario = await this.generateUniquePacienteCpf();

    const paciente = this.pacienteRepository.create({
      nomeCompleto: usuario.nome || 'Paciente',
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
      contatoWhatsapp: '00000000000',
      contatoEmail: usuario.email,
      ativo: true,
      usuarioId: usuario.id,
      pacienteUsuarioId: usuario.id,
      anamneseLiberadaPaciente: true,
      cadastroOrigem: PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
      vinculoStatus: PacienteVinculoStatus.SEM_VINCULO,
      conviteEnviadoEm: null,
      conviteAceitoEm: null,
    });

    return this.pacienteRepository.save(paciente);
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

    if (pacienteUsuarioId) {
      const pacienteAutonomo = await this.pacienteRepository.findOne({
        where: { pacienteUsuarioId, ativo: true },
      });
      const podeAdotarCadastroAutonomo =
        !!pacienteAutonomo && pacienteAutonomo.usuarioId === pacienteUsuarioId;

      if (podeAdotarCadastroAutonomo && pacienteAutonomo) {
        Object.assign(pacienteAutonomo, {
          ...createPacienteDto,
          cadastroOrigem,
          vinculoStatus: this.resolveInitialVinculoStatus(
            pacienteUsuarioId,
            cadastroOrigem,
          ),
          conviteEnviadoEm: null,
          conviteAceitoEm: new Date(),
          usuarioId,
          pacienteUsuarioId,
        });
        const savedAutonomo = await this.pacienteRepository.save(pacienteAutonomo);
        await this.upsertVinculoAtivo(savedAutonomo, pacienteUsuarioId);
        return savedAutonomo;
      }
    }

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

  async findAll(usuarioId: string): Promise<PacienteListItemDto[]> {
    const pacientes = await this.addPacienteListSelects(
      this.buildScopedPacientesQuery(usuarioId),
    )
      .orderBy('p.nomeCompleto', 'ASC')
      .getMany();

    const statusByPaciente = await this.buildCicloStatusByPacienteIds(
      pacientes.map((paciente) => paciente.id),
    );

    return pacientes.map((paciente) =>
      this.toPacienteListItem(
        this.applyDisplayNameFallback(paciente),
        statusByPaciente.get(paciente.id),
      ),
    );
  }

  async findPaged(
    usuarioId: string,
    page: number,
    limit: number,
  ): Promise<PacientePagedResponseDto> {
    const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
    const safeLimit = Number.isFinite(limit)
      ? Math.min(100, Math.max(10, limit))
      : 30;
    const skip = (safePage - 1) * safeLimit;

    const baseQuery = this.buildScopedPacientesQuery(usuarioId);
    const total = await baseQuery.clone().getCount();
    const data = await this.addPacienteListSelects(baseQuery)
      .orderBy('p.nomeCompleto', 'ASC')
      .take(safeLimit)
      .skip(skip)
      .getMany();

    const statusByPaciente = await this.buildCicloStatusByPacienteIds(
      data.map((paciente) => paciente.id),
    );

    return {
      data: data.map((paciente) =>
        this.toPacienteListItem(
          this.applyDisplayNameFallback(paciente),
          statusByPaciente.get(paciente.id),
        ),
      ),
      total,
      page: safePage,
      limit: safeLimit,
      hasNext: skip + data.length < total,
    };
  }

  async findOne(id: string, usuarioId: string): Promise<Paciente> {
    const paciente = await this.buildScopedPacientesQuery(usuarioId)
      .andWhere('p.id = :id', { id })
      .leftJoin('p.pacienteUsuario', 'pacienteUsuario')
      .addSelect(['pacienteUsuario.id', 'pacienteUsuario.nome'])
      .getOne();

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

  async findLinkedPacienteByUsuarioId(usuarioId: string): Promise<Paciente> {
    const vinculoAtivo = await this.vinculoRepository.findOne({
      where: {
        pacienteUsuarioId: usuarioId,
        status: ProfissionalPacienteVinculoStatus.ATIVO,
      },
      order: { createdAt: 'DESC' },
    });

    const vinculoAtivoLegado =
      vinculoAtivo ||
      (await this.vinculoRepository
        .createQueryBuilder('v')
        .innerJoin(Paciente, 'p', 'p.id = v.paciente_id')
        .where('v.status = :status', {
          status: ProfissionalPacienteVinculoStatus.ATIVO,
        })
        .andWhere('p.paciente_usuario_id = :usuarioId', { usuarioId })
        .orderBy('v.created_at', 'DESC')
        .getOne());

    if (vinculoAtivoLegado) {
      const pacienteByVinculo = await this.pacienteRepository.findOne({
        where: { id: vinculoAtivoLegado.pacienteId, ativo: true },
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

  async findPacienteByUsuarioId(usuarioId: string): Promise<Paciente | null> {
    const vinculoAtivo = await this.vinculoRepository.findOne({
      where: {
        pacienteUsuarioId: usuarioId,
        status: ProfissionalPacienteVinculoStatus.ATIVO,
      },
      order: { createdAt: 'DESC' },
    });

    const vinculoAtivoLegado =
      vinculoAtivo ||
      (await this.vinculoRepository
        .createQueryBuilder('v')
        .innerJoin(Paciente, 'p', 'p.id = v.paciente_id')
        .where('v.status = :status', {
          status: ProfissionalPacienteVinculoStatus.ATIVO,
        })
        .andWhere('p.paciente_usuario_id = :usuarioId', { usuarioId })
        .orderBy('v.created_at', 'DESC')
        .getOne());

    if (vinculoAtivoLegado) {
      const pacienteByVinculo = await this.pacienteRepository.findOne({
        where: { id: vinculoAtivoLegado.pacienteId, ativo: true },
      });

      if (pacienteByVinculo) {
        return pacienteByVinculo;
      }
    }

    return this.pacienteRepository.findOne({
      where: { pacienteUsuarioId: usuarioId, ativo: true },
      order: { conviteAceitoEm: 'DESC', updatedAt: 'DESC' },
    });
  }

  async remove(id: string, usuarioId: string): Promise<void> {
    let paciente: Paciente;
    try {
      paciente = await this.findOne(id, usuarioId);
    } catch (error) {
      // Idempotencia: se nao estiver mais no escopo (ja removido/desvinculado),
      // nao quebrar o fluxo de exclusao no cliente.
      if (error instanceof NotFoundException) {
        return;
      }
      throw error;
    }

    if (paciente.pacienteUsuarioId) {
      // Paciente com conta no app: remove da carteira do profissional
      // mantendo o cadastro ativo para o proprio paciente.
      paciente.vinculoStatus = PacienteVinculoStatus.SEM_VINCULO;
      await this.pacienteRepository.save(paciente);
      await this.closeVinculoAtivoByPaciente(paciente.id);
      return;
    }

    // Paciente sem conta vinculada: inativacao do cadastro do profissional.
    paciente.ativo = false;
    await this.pacienteRepository.save(paciente);
    await this.closeVinculoAtivoByPaciente(paciente.id);
  }

  async getAttentionMap(usuarioId: string): Promise<Record<string, number | null>> {
    const vinculoTable = this.vinculoRepository.metadata.tableName;
    const rows = await this.pacienteRepository
      .createQueryBuilder('p')
      .leftJoin(
        this.evolucaoRepository.metadata.tableName,
        'e',
        'e.paciente_id = p.id',
      )
      .andWhere('p.ativo = :ativo', { ativo: true })
      .andWhere(
        `(p.usuario_id = :usuarioId OR EXISTS (
          SELECT 1
          FROM ${vinculoTable} v
          WHERE v.paciente_id = p.id
            AND v.profissional_id = :usuarioId
            AND v.status = :vinculoStatusAtivo
        ))`,
        {
          usuarioId,
          vinculoStatusAtivo: ProfissionalPacienteVinculoStatus.ATIVO,
        },
      )
      .select('p.id', 'pacienteId')
      .addSelect('p.created_at', 'createdAt')
      .addSelect('MAX(e.data)', 'lastEvolucaoAt')
      .groupBy('p.id')
      .addGroupBy('p.created_at')
      .getRawMany<{
        pacienteId: string;
        createdAt: string | null;
        lastEvolucaoAt: string | null;
      }>();

    const pacienteIds = rows.map((row) => row.pacienteId);
    const latestLaudos = pacienteIds.length
      ? await this.laudoRepository
          .createQueryBuilder('l')
          .where('l.pacienteId IN (:...pacienteIds)', { pacienteIds })
          .orderBy('l.pacienteId', 'ASC')
          .addOrderBy('l.updatedAt', 'DESC')
          .getMany()
      : [];
    const laudoByPaciente = new Map<string, Laudo>();
    latestLaudos.forEach((item) => {
      if (!laudoByPaciente.has(item.pacienteId)) laudoByPaciente.set(item.pacienteId, item);
    });

    const pacientesComAtividadeAtiva = pacienteIds.length
      ? await this.atividadeRepository
          .createQueryBuilder('a')
          .select('a.pacienteId', 'pacienteId')
          .where('a.ativo = :ativo', { ativo: true })
          .andWhere('a.pacienteId IN (:...pacienteIds)', { pacienteIds })
          .groupBy('a.pacienteId')
          .getRawMany<{ pacienteId: string }>()
      : [];
    const atividadePacienteIds = new Set(
      pacientesComAtividadeAtiva.map((row) => row.pacienteId),
    );

    const now = Date.now();
    const result: Record<string, number | null> = {};

    for (const row of rows) {
      const lastLaudo = laudoByPaciente.get(row.pacienteId);
      const hasAltaDocumento =
        lastLaudo?.status === LaudoStatus.VALIDADO_PROFISSIONAL &&
        !!lastLaudo.criteriosAlta;
      const hasActiveActivity = atividadePacienteIds.has(row.pacienteId);
      const tratamentoConcluido = hasAltaDocumento && !hasActiveActivity;

      if (tratamentoConcluido) {
        result[row.pacienteId] = 0;
        continue;
      }

      if (!row.lastEvolucaoAt) {
        const createdAt = row.createdAt ? new Date(row.createdAt).getTime() : NaN;
        if (Number.isNaN(createdAt)) {
          result[row.pacienteId] = null;
          continue;
        }

        const daysSinceCreation = Math.floor(
          (now - createdAt) / (1000 * 60 * 60 * 24),
        );
        result[row.pacienteId] = daysSinceCreation > 7 ? null : 0;
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
    const total = await this.buildScopedPacientesQuery(usuarioId).getCount();

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

    const paciente = await this.findPacienteByUsuarioId(usuario.id);

    if (!paciente) {
      return {
        vinculado: false,
        paciente: null,
        resumo: null,
      };
    }

    const vinculoAtivo = await this.vinculoRepository.findOne({
      where: {
        pacienteUsuarioId: usuario.id,
        status: ProfissionalPacienteVinculoStatus.ATIVO,
      },
      order: { createdAt: 'DESC' },
    });

    if (!vinculoAtivo) {
      return {
        vinculado: false,
        paciente,
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

  async updateMyPacienteProfile(
    usuario: Usuario,
    updatePacienteDto: UpdatePacienteDto,
  ): Promise<Paciente> {
    if (usuario.role !== UserRole.PACIENTE) {
      throw new ForbiddenException('Acesso permitido somente para pacientes');
    }

    const pacienteExistente = await this.findPacienteByUsuarioId(usuario.id);
    const paciente =
      pacienteExistente || (await this.findOrCreateSelfPacienteForUsuario(usuario.id));

    if (updatePacienteDto.cpf && updatePacienteDto.cpf !== paciente.cpf) {
      const existingPaciente = await this.pacienteRepository.findOne({
        where: {
          cpf: updatePacienteDto.cpf,
          usuarioId: paciente.usuarioId,
        },
      });

      if (existingPaciente && existingPaciente.id !== paciente.id) {
        throw new ConflictException('CPF ja cadastrado');
      }
    }

    const allowedFields: (keyof UpdatePacienteDto)[] = [
      'nomeCompleto',
      'cpf',
      'rg',
      'dataNascimento',
      'sexo',
      'estadoCivil',
      'profissao',
      'enderecoRua',
      'enderecoNumero',
      'enderecoComplemento',
      'enderecoBairro',
      'enderecoCep',
      'enderecoCidade',
      'enderecoUf',
      'contatoWhatsapp',
      'contatoTelefone',
      'contatoEmail',
    ];

    const safePatch: Partial<UpdatePacienteDto> = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updatePacienteDto, field)) {
        (safePatch as Record<string, unknown>)[field] = (updatePacienteDto as Record<string, unknown>)[field];
      }
    }

    Object.assign(paciente, safePatch);
    const saved = await this.pacienteRepository.save(paciente);
    return this.applyDisplayNameFallback(saved);
  }

  private async resolveExameScope(
    pacienteId: string,
    actor: Usuario,
  ): Promise<{ paciente: Paciente; ownerUsuarioId: string }> {
    if (actor.role === UserRole.PACIENTE) {
      const linkedPaciente = await this.findLinkedPacienteByUsuarioId(actor.id);
      if (linkedPaciente.id !== pacienteId) {
        throw new ForbiddenException('Paciente sem permissao para este recurso');
      }
      return {
        paciente: linkedPaciente,
        ownerUsuarioId: linkedPaciente.usuarioId,
      };
    }

    const paciente = await this.findOne(pacienteId, actor.id);
    return {
      paciente,
      ownerUsuarioId: paciente.usuarioId,
    };
  }

  async resolveExameOwnerUsuarioId(
    pacienteId: string,
    actor: Usuario,
  ): Promise<string> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    return ownerUsuarioId;
  }

  async listExames(pacienteId: string, actor: Usuario): Promise<PacienteExame[]> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    return this.pacienteExameRepository.find({
      where: { pacienteId, usuarioId: ownerUsuarioId },
      order: { createdAt: 'DESC' },
    });
  }

  async createExame(
    pacienteId: string,
    actor: Usuario,
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
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    const exame = this.pacienteExameRepository.create({
      pacienteId,
      usuarioId: ownerUsuarioId,
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
    actor: Usuario,
  ): Promise<PacienteExame> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    const exame = await this.pacienteExameRepository.findOne({
      where: { id: exameId, pacienteId, usuarioId: ownerUsuarioId },
    });
    if (!exame) {
      throw new NotFoundException('Exame nao encontrado');
    }
    return exame;
  }

  async removeExame(
    pacienteId: string,
    exameId: string,
    actor: Usuario,
  ): Promise<PacienteExame> {
    const exame = await this.findExameOrFail(pacienteId, exameId, actor);
    await this.pacienteExameRepository.remove(exame);
    return exame;
  }
}
