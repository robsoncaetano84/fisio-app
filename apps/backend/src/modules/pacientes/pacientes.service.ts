import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  ClinicalPhoto,
  ClinicalPhotoType,
  ClinicalPhotoView,
} from './entities/clinical-photo.entity';
import { ClinicalPhotoComparison } from './entities/clinical-photo-comparison.entity';
import {
  ProfissionalPacienteVinculo,
  ProfissionalPacienteVinculoOrigem,
  ProfissionalPacienteVinculoStatus,
} from './entities/profissional-paciente-vinculo.entity';
import { readExameFile } from './exame-storage';
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
  private masterAdminEmailsCache: Set<string> | null = null;
  private readonly masterByUserIdCache = new Map<string, boolean>();

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
    @InjectRepository(ClinicalPhoto)
    private readonly clinicalPhotoRepository: Repository<ClinicalPhoto>,
    @InjectRepository(ClinicalPhotoComparison)
    private readonly clinicalPhotoComparisonRepository: Repository<ClinicalPhotoComparison>,
    @InjectRepository(ProfissionalPacienteVinculo)
    private readonly vinculoRepository: Repository<ProfissionalPacienteVinculo>,
    @InjectRepository(Atividade)
    private readonly atividadeRepository: Repository<Atividade>,
    @InjectRepository(Anamnese)
    private readonly anamneseRepository: Repository<Anamnese>,
    private readonly configService: ConfigService,
  ) {}

  private getMasterAdminEmails(): Set<string> {
    if (this.masterAdminEmailsCache) return this.masterAdminEmailsCache;
    const raw = (this.configService.get<string>('MASTER_ADMIN_EMAILS') || '').trim();
    const emails = raw
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    this.masterAdminEmailsCache = new Set(emails);
    return this.masterAdminEmailsCache;
  }

  async isMasterAdminByUsuarioId(usuarioId: string): Promise<boolean> {
    if (!usuarioId) return false;
    if (this.masterByUserIdCache.has(usuarioId)) {
      return this.masterByUserIdCache.get(usuarioId) === true;
    }

    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId, ativo: true },
      select: ['id', 'email'],
    });
    const email = (usuario?.email || '').trim().toLowerCase();
    const isMaster = !!email && this.getMasterAdminEmails().has(email);
    this.masterByUserIdCache.set(usuarioId, isMaster);
    return isMaster;
  }

  private buildScopedPacientesQuery(usuarioId: string, isMasterAdmin = false) {
    if (isMasterAdmin) {
      return this.pacienteRepository
        .createQueryBuilder('p')
        .where('p.ativo = :ativo', { ativo: true });
    }

    const vinculoTable = this.vinculoRepository.metadata.tableName;
    return this.pacienteRepository
      .createQueryBuilder('p')
      .leftJoin(
        vinculoTable,
        'vScope',
        'vScope.paciente_id = p.id AND vScope.profissional_id = :usuarioId AND vScope.status = :vinculoStatusAtivo',
        {
          usuarioId,
          vinculoStatusAtivo: ProfissionalPacienteVinculoStatus.ATIVO,
        },
      )
      .where('p.ativo = :ativo', { ativo: true })
      .andWhere(
        '((p.usuarioId = :usuarioId AND p.pacienteUsuarioId IS NULL) OR vScope.id IS NOT NULL)',
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
    const isMasterAdmin = await this.isMasterAdminByUsuarioId(usuarioId);
    const pacientes = await this.addPacienteListSelects(
      this.buildScopedPacientesQuery(usuarioId, isMasterAdmin),
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
    const isMasterAdmin = await this.isMasterAdminByUsuarioId(usuarioId);
    const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
    const safeLimit = Number.isFinite(limit)
      ? Math.min(100, Math.max(10, limit))
      : 30;
    const skip = (safePage - 1) * safeLimit;

    const baseQuery = this.buildScopedPacientesQuery(usuarioId, isMasterAdmin);
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
    const isMasterAdmin = await this.isMasterAdminByUsuarioId(usuarioId);
    const paciente = await this.buildScopedPacientesQuery(usuarioId, isMasterAdmin)
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
        where: { cpf: updatePacienteDto.cpf, usuarioId: paciente.usuarioId },
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
        .andWhere('p.pacienteUsuarioId = :usuarioId', { usuarioId })
        .orderBy('v.createdAt', 'DESC')
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
        .andWhere('p.pacienteUsuarioId = :usuarioId', { usuarioId })
        .orderBy('v.createdAt', 'DESC')
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
    const isMasterAdmin = await this.isMasterAdminByUsuarioId(usuarioId);
    const vinculoTable = this.vinculoRepository.metadata.tableName;
    const rowsQuery = this.pacienteRepository
      .createQueryBuilder('p')
      .leftJoin(
        this.evolucaoRepository.metadata.tableName,
        'e',
        'e.paciente_id = p.id',
      )
      .andWhere('p.ativo = :ativo', { ativo: true })
      .select('p.id', 'pacienteId')
      .addSelect('p.createdAt', 'createdAt')
      .addSelect('MAX(e.data)', 'lastEvolucaoAt')
      .groupBy('p.id')
      .addGroupBy('p.createdAt');

    if (!isMasterAdmin) {
      rowsQuery
        .leftJoin(
          vinculoTable,
          'vScope',
          'vScope.paciente_id = p.id AND vScope.profissional_id = :usuarioId AND vScope.status = :vinculoStatusAtivo',
          {
            usuarioId,
            vinculoStatusAtivo: ProfissionalPacienteVinculoStatus.ATIVO,
          },
        )
        .andWhere('(p.usuarioId = :usuarioId OR vScope.id IS NOT NULL)', {
          usuarioId,
          vinculoStatusAtivo: ProfissionalPacienteVinculoStatus.ATIVO,
        });
    }

    const rows = await rowsQuery.getRawMany<{
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
    const isMasterAdmin = await this.isMasterAdminByUsuarioId(usuarioId);
    const total = await this.buildScopedPacientesQuery(usuarioId, isMasterAdmin).getCount();

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

  async listClinicalPhotos(
    pacienteId: string,
    actor: Usuario,
  ): Promise<ClinicalPhoto[]> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    return this.clinicalPhotoRepository.find({
      where: { pacienteId, usuarioId: ownerUsuarioId },
      order: { createdAt: 'DESC' },
    });
  }

  async listClinicalPhotoComparisons(
    pacienteId: string,
    actor: Usuario,
  ): Promise<ClinicalPhotoComparison[]> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    return this.clinicalPhotoComparisonRepository.find({
      where: { pacienteId, usuarioId: ownerUsuarioId },
      order: { createdAt: 'DESC' },
    });
  }

  async createClinicalPhoto(
    pacienteId: string,
    actor: Usuario,
    payload: {
      nomeOriginal: string;
      nomeArquivo: string;
      mimeType: string;
      tamanhoBytes: number;
      caminhoArquivo: string;
      tipo?: ClinicalPhotoType;
      vista?: ClinicalPhotoView;
      regiao?: string;
      lado?: string;
      intensidadeDor?: number | null;
      observacao?: string;
      dataFoto?: Date | null;
    },
  ): Promise<ClinicalPhoto> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    const photo = this.clinicalPhotoRepository.create({
      pacienteId,
      usuarioId: ownerUsuarioId,
      nomeOriginal: payload.nomeOriginal,
      nomeArquivo: payload.nomeArquivo,
      mimeType: payload.mimeType,
      tamanhoBytes: payload.tamanhoBytes,
      caminhoArquivo: payload.caminhoArquivo,
      tipo: payload.tipo || ClinicalPhotoType.FOTO_POSTURAL_FRONTAL,
      vista: payload.vista || null,
      regiao: payload.regiao?.trim() || null,
      lado: payload.lado?.trim() || null,
      intensidadeDor:
        typeof payload.intensidadeDor === 'number'
          ? Math.max(0, Math.min(10, payload.intensidadeDor))
          : null,
      observacao: payload.observacao?.trim() || null,
      dataFoto: payload.dataFoto || null,
      qualityScore: null,
      aiAnalise: null,
      aiLimites: null,
      aiRaw: null,
      confirmadoPorProfissional: false,
    });
    return this.clinicalPhotoRepository.save(photo);
  }

  async findClinicalPhotoOrFail(
    pacienteId: string,
    photoId: string,
    actor: Usuario,
  ): Promise<ClinicalPhoto> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    const photo = await this.clinicalPhotoRepository.findOne({
      where: { id: photoId, pacienteId, usuarioId: ownerUsuarioId },
    });
    if (!photo) {
      throw new NotFoundException('Foto clinica nao encontrada');
    }
    return photo;
  }

  async removeClinicalPhoto(
    pacienteId: string,
    photoId: string,
    actor: Usuario,
  ): Promise<ClinicalPhoto> {
    const photo = await this.findClinicalPhotoOrFail(pacienteId, photoId, actor);
    await this.clinicalPhotoRepository.remove(photo);
    return photo;
  }

  async analyzeClinicalPhoto(
    pacienteId: string,
    photoId: string,
    actor: Usuario,
  ): Promise<ClinicalPhoto> {
    const photo = await this.findClinicalPhotoOrFail(pacienteId, photoId, actor);
    const fileBuffer = await readExameFile(photo.caminhoArquivo);
    const analysis = await this.interpretClinicalPhotoWithAI({
      photo,
      fileBuffer,
    });

    if (!analysis) {
      photo.aiLimites =
        'Analise visual por IA indisponivel. Use a foto apenas como registro clinico.';
      return this.clinicalPhotoRepository.save(photo);
    }

    photo.qualityScore = analysis.qualityScore;
    photo.aiAnalise = analysis.summary;
    photo.aiLimites = analysis.limitations;
    photo.aiRaw = analysis.raw;
    return this.clinicalPhotoRepository.save(photo);
  }

  async compareClinicalPhotos(
    pacienteId: string,
    actor: Usuario,
    payload: {
      baselinePhotoId: string;
      followupPhotoId: string;
      regiao?: string;
      vista?: string;
      observacao?: string;
    },
  ): Promise<ClinicalPhotoComparison> {
    const baseline = await this.findClinicalPhotoOrFail(
      pacienteId,
      payload.baselinePhotoId,
      actor,
    );
    const followup = await this.findClinicalPhotoOrFail(
      pacienteId,
      payload.followupPhotoId,
      actor,
    );

    const [baselineBuffer, followupBuffer] = await Promise.all([
      readExameFile(baseline.caminhoArquivo),
      readExameFile(followup.caminhoArquivo),
    ]);
    const analysis = await this.interpretClinicalPhotoComparisonWithAI({
      baseline,
      followup,
      baselineBuffer,
      followupBuffer,
      observacao: payload.observacao || '',
    });

    const comparison = this.clinicalPhotoComparisonRepository.create({
      pacienteId,
      usuarioId: baseline.usuarioId,
      baselinePhotoId: baseline.id,
      followupPhotoId: followup.id,
      regiao: payload.regiao?.trim() || baseline.regiao || followup.regiao || null,
      vista: payload.vista?.trim() || baseline.vista || followup.vista || null,
      observacao: payload.observacao?.trim() || null,
      resumo:
        analysis?.summary ||
        'Comparacao registrada. Analise visual por IA indisponivel no momento.',
      aiComparacao: analysis?.comparison || null,
      aiLimites:
        analysis?.limitations ||
        'Compare apenas fotos com mesma vista, distancia e iluminacao semelhantes.',
      aiRaw: analysis?.raw || null,
      confirmadoPorProfissional: false,
    });
    return this.clinicalPhotoComparisonRepository.save(comparison);
  }

  private shouldUseExamAi(): boolean {
    return (process.env.OPENAI_EXAM_AI_ENABLED || 'true') !== 'false';
  }

  private getPositiveIntegerEnv(
    key: string,
    fallback: number,
    max: number,
  ): number {
    const value = Number(process.env[key]);
    if (!Number.isFinite(value) || value <= 0) return fallback;
    return Math.min(Math.floor(value), max);
  }

  private extractJsonObject(raw: string): Record<string, unknown> | null {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private extractOutputText(data: {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  }): string {
    return (
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        .map((content) => content.text || '')
        .join('\n') ||
      ''
    );
  }

  private asStringArray(value: unknown, maxItems = 6): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, maxItems);
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private asQualityScore(value: unknown): number | null {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return null;
    return Math.max(0, Math.min(100, Math.round(numberValue)));
  }

  private buildOpenAiClinicalVisionRequest(input: {
    prompt: string;
    images: Array<{ mimeType: string; buffer: Buffer }>;
  }) {
    const content: Array<Record<string, unknown>> = [
      { type: 'input_text', text: input.prompt },
    ];
    for (const image of input.images) {
      content.push({
        type: 'input_image',
        image_url: `data:${image.mimeType};base64,${image.buffer.toString('base64')}`,
      });
    }
    return content;
  }

  private async callClinicalVisionAi(input: {
    prompt: string;
    images: Array<{ mimeType: string; buffer: Buffer }>;
  }): Promise<Record<string, unknown> | null> {
    const apiKey = (process.env.OPENAI_API_KEY || '').trim();
    if (!apiKey || !this.shouldUseExamAi()) return null;

    const model = (
      process.env.OPENAI_EXAM_MODEL ||
      process.env.OPENAI_LAUDO_MODEL ||
      process.env.OPENAI_MODEL ||
      'gpt-4.1-mini'
    ).trim();

    const controller = new AbortController();
    const timeoutMs = this.getPositiveIntegerEnv(
      'OPENAI_EXAM_TIMEOUT_MS',
      30000,
      120000,
    );
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: 'system',
              content:
                'Voce e um assistente clinico de fisioterapia. Analise fotos clinicas com prudencia, sem diagnosticar por imagem e sempre destacando limitacoes.',
            },
            {
              role: 'user',
              content: this.buildOpenAiClinicalVisionRequest(input),
            },
          ],
          temperature: 0.1,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) return null;
      const data = (await response.json()) as {
        output_text?: string;
        output?: Array<{ content?: Array<{ text?: string }> }>;
      };
      return this.extractJsonObject(this.extractOutputText(data));
    } catch {
      return null;
    }
  }

  private async interpretClinicalPhotoWithAI(input: {
    photo: ClinicalPhoto;
    fileBuffer: Buffer;
  }): Promise<{
    qualityScore: number | null;
    summary: string;
    limitations: string;
    raw: Record<string, unknown>;
  } | null> {
    const prompt = `Analise a foto clinica de fisioterapia e retorne SOMENTE JSON com:
qualidadeImagemScore (numero de 0 a 100),
qualidadeImagem (string curta),
observacoesVisuais (array de strings),
assimetriasProvaveis (array de strings),
sugestoesExameFisico (array de strings),
redFlagsVisuais (array de strings),
limitacoes (string curta).

Contexto:
tipo=${input.photo.tipo}
vista=${input.photo.vista || 'nao informada'}
regiao=${input.photo.regiao || 'nao informada'}
lado=${input.photo.lado || 'nao informado'}
intensidadeDor=${input.photo.intensidadeDor ?? 'nao informada'}
observacao=${input.photo.observacao || 'sem observacao'}
`;

    const parsed = await this.callClinicalVisionAi({
      prompt,
      images: [{ mimeType: input.photo.mimeType, buffer: input.fileBuffer }],
    });
    if (!parsed) return null;

    const summaryParts = [
      this.asString(parsed.qualidadeImagem)
        ? `Qualidade: ${this.asString(parsed.qualidadeImagem)}`
        : '',
      ...this.asStringArray(parsed.observacoesVisuais).map(
        (item) => `Observacao: ${item}`,
      ),
      ...this.asStringArray(parsed.assimetriasProvaveis).map(
        (item) => `Assimetria provavel: ${item}`,
      ),
      ...this.asStringArray(parsed.sugestoesExameFisico).map(
        (item) => `Validar no exame fisico: ${item}`,
      ),
      ...this.asStringArray(parsed.redFlagsVisuais).map(
        (item) => `Alerta visual: ${item}`,
      ),
    ].filter(Boolean);

    return {
      qualityScore: this.asQualityScore(parsed.qualidadeImagemScore),
      summary:
        summaryParts.join('\n') ||
        'Analise visual concluida sem achados estruturados relevantes.',
      limitations:
        this.asString(parsed.limitacoes) ||
        'Foto clinica nao substitui exame fisico, medida objetiva ou julgamento profissional.',
      raw: parsed,
    };
  }

  private async interpretClinicalPhotoComparisonWithAI(input: {
    baseline: ClinicalPhoto;
    followup: ClinicalPhoto;
    baselineBuffer: Buffer;
    followupBuffer: Buffer;
    observacao: string;
  }): Promise<{
    summary: string;
    comparison: string;
    limitations: string;
    raw: Record<string, unknown>;
  } | null> {
    const prompt = `Compare duas fotos clinicas de fisioterapia: a primeira e ANTES/baseline, a segunda e DEPOIS/follow-up.
Retorne SOMENTE JSON com:
comparabilidade (string curta),
mudancasVisuais (array de strings),
melhoraPioraSemMudanca (string curta),
sugestaoSoapObjetivo (string curta),
recomendacaoRepetirFoto (string curta),
limitacoes (string curta).

Contexto:
baseline_tipo=${input.baseline.tipo}
followup_tipo=${input.followup.tipo}
baseline_vista=${input.baseline.vista || 'nao informada'}
followup_vista=${input.followup.vista || 'nao informada'}
regiao=${input.followup.regiao || input.baseline.regiao || 'nao informada'}
observacao=${input.observacao || 'sem observacao'}
`;

    const parsed = await this.callClinicalVisionAi({
      prompt,
      images: [
        { mimeType: input.baseline.mimeType, buffer: input.baselineBuffer },
        { mimeType: input.followup.mimeType, buffer: input.followupBuffer },
      ],
    });
    if (!parsed) return null;

    const changes = this.asStringArray(parsed.mudancasVisuais);
    const summary = [
      this.asString(parsed.comparabilidade)
        ? `Comparabilidade: ${this.asString(parsed.comparabilidade)}`
        : '',
      this.asString(parsed.melhoraPioraSemMudanca)
        ? `Evolucao visual: ${this.asString(parsed.melhoraPioraSemMudanca)}`
        : '',
      ...changes.map((item) => `Mudanca: ${item}`),
      this.asString(parsed.sugestaoSoapObjetivo)
        ? `SOAP objetivo: ${this.asString(parsed.sugestaoSoapObjetivo)}`
        : '',
    ].filter(Boolean);

    return {
      summary: summary.join('\n') || 'Comparacao visual concluida.',
      comparison: changes.join('\n') || this.asString(parsed.melhoraPioraSemMudanca),
      limitations:
        this.asString(parsed.limitacoes) ||
        this.asString(parsed.recomendacaoRepetirFoto) ||
        'Comparacao visual depende de mesma vista, distancia, iluminacao e postura inicial.',
      raw: parsed,
    };
  }
}
