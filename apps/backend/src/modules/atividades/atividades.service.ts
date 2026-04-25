// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// ATIVIDADES.SERVICE
// ==========================================
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { Atividade } from './entities/atividade.entity';
import { AtividadeAiGeneration } from './entities/atividade-ai-generation.entity';
import {
  AtividadeCheckin,
  DificuldadeExecucao,
  MelhoriaSessao,
} from './entities/atividade-checkin.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { CreateAtividadeCheckinDto } from './dto/create-atividade-checkin.dto';
import { DuplicateAtividadeDto } from './dto/duplicate-atividade.dto';
import { DuplicateAtividadesBatchDto } from './dto/duplicate-atividades-batch.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { GenerateAtividadeAiDto } from './dto/generate-atividade-ai.dto';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

@Injectable()
export class AtividadesService {
  constructor(
    @InjectRepository(Atividade)
    private readonly atividadeRepository: Repository<Atividade>,
    @InjectRepository(AtividadeCheckin)
    private readonly checkinRepository: Repository<AtividadeCheckin>,
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    @InjectRepository(Anamnese)
    private readonly anamneseRepository: Repository<Anamnese>,
    private readonly notificacoesService: NotificacoesService,
  ) {}

  async create(dto: CreateAtividadeDto, usuarioId: string): Promise<Atividade> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id: dto.pacienteId, usuarioId, ativo: true },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente nao encontrado');
    }

    const atividade = this.atividadeRepository.create({
      pacienteId: dto.pacienteId,
      usuarioId,
      titulo: dto.titulo.trim(),
      descricao: dto.descricao?.trim() || null,
      dataLimite: dto.dataLimite ? new Date(dto.dataLimite) : null,
      diaPrescricao:
        typeof dto.diaPrescricao === 'number' ? dto.diaPrescricao : null,
      ordemNoDia: typeof dto.ordemNoDia === 'number' ? dto.ordemNoDia : null,
      repetirSemanal: dto.repetirSemanal ?? true,
      aceiteProfissional: dto.aceiteProfissional === true,
      aceiteProfissionalPorUsuarioId:
        dto.aceiteProfissional === true ? usuarioId : null,
      aceiteProfissionalEm: dto.aceiteProfissional === true ? new Date() : null,
      ativo: true,
    });

    return this.atividadeRepository.save(atividade);
  }

  async findByPaciente(
    pacienteId: string,
    usuarioId: string,
  ): Promise<Atividade[]> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id: pacienteId, usuarioId, ativo: true },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente nao encontrado');
    }

    return this.atividadeRepository.find({
      where: { pacienteId, usuarioId, ativo: true },
      order: { diaPrescricao: 'ASC', ordemNoDia: 'ASC', createdAt: 'DESC' },
    });
  }

  async inativar(
    atividadeId: string,
    usuarioId: string,
  ): Promise<{ success: true }> {
    const atividade = await this.atividadeRepository.findOne({
      where: { id: atividadeId, usuarioId, ativo: true },
    });
    if (!atividade) {
      throw new NotFoundException('Atividade nao encontrada');
    }

    atividade.ativo = false;
    await this.atividadeRepository.save(atividade);
    return { success: true };
  }

  async duplicar(
    atividadeId: string,
    usuarioId: string,
    dto?: DuplicateAtividadeDto,
  ): Promise<Atividade> {
    const origem = await this.atividadeRepository.findOne({
      where: { id: atividadeId, usuarioId, ativo: true },
    });
    if (!origem) {
      throw new NotFoundException('Atividade nao encontrada');
    }

    const diaDestino = dto?.diaPrescricao ?? origem.diaPrescricao ?? null;
    let ordemNoDia = origem.ordemNoDia;
    if (diaDestino) {
      const atividadesNoMesmoDia = await this.atividadeRepository.find({
        where: {
          usuarioId,
          pacienteId: origem.pacienteId,
          diaPrescricao: diaDestino,
          ativo: true,
        },
        select: ['ordemNoDia'],
      });
      const maxOrdem = atividadesNoMesmoDia.reduce((max, item) => {
        const value = item.ordemNoDia ?? 0;
        return value > max ? value : max;
      }, 0);
      ordemNoDia = maxOrdem > 0 ? maxOrdem + 1 : origem.ordemNoDia;
    }

    const clone = this.atividadeRepository.create({
      pacienteId: origem.pacienteId,
      usuarioId: origem.usuarioId,
      titulo: `${origem.titulo} (copia)`,
      descricao: origem.descricao,
      dataLimite: origem.dataLimite,
      diaPrescricao: diaDestino,
      ordemNoDia: ordemNoDia ?? null,
      repetirSemanal: origem.repetirSemanal,
      aceiteProfissional: false,
      aceiteProfissionalPorUsuarioId: null,
      aceiteProfissionalEm: null,
      ativo: true,
    });

    return this.atividadeRepository.save(clone);
  }

  async duplicarLote(
    usuarioId: string,
    dto: DuplicateAtividadesBatchDto,
  ): Promise<{ total: number }> {
    let total = 0;
    for (const atividadeId of dto.atividadeIds) {
      await this.duplicar(atividadeId, usuarioId, {
        diaPrescricao: dto.diaPrescricao,
      });
      total += 1;
    }
    return { total };
  }

  async update(
    atividadeId: string,
    dto: UpdateAtividadeDto,
    usuarioId: string,
  ): Promise<Atividade> {
    const atividade = await this.atividadeRepository.findOne({
      where: { id: atividadeId, usuarioId, ativo: true },
    });
    if (!atividade) {
      throw new NotFoundException('Atividade nao encontrada');
    }

    const hasClinicalChange =
      (typeof dto.titulo === 'string' &&
        dto.titulo.trim() !== atividade.titulo) ||
      (typeof dto.descricao === 'string' &&
        (dto.descricao.trim() || null) !== atividade.descricao) ||
      (typeof dto.dataLimite === 'string' &&
        (dto.dataLimite
          ? new Date(dto.dataLimite).toISOString().slice(0, 10)
          : null) !==
          (atividade.dataLimite
            ? new Date(atividade.dataLimite).toISOString().slice(0, 10)
            : null)) ||
      (typeof dto.diaPrescricao === 'number' &&
        dto.diaPrescricao !== atividade.diaPrescricao) ||
      (typeof dto.ordemNoDia === 'number' &&
        dto.ordemNoDia !== atividade.ordemNoDia) ||
      (typeof dto.repetirSemanal === 'boolean' &&
        dto.repetirSemanal !== atividade.repetirSemanal);

    if (dto.pacienteId && dto.pacienteId !== atividade.pacienteId) {
      const paciente = await this.pacienteRepository.findOne({
        where: { id: dto.pacienteId, usuarioId, ativo: true },
      });
      if (!paciente) {
        throw new NotFoundException('Paciente nao encontrado');
      }
      atividade.pacienteId = dto.pacienteId;
    }

    if (typeof dto.titulo === 'string') {
      atividade.titulo = dto.titulo.trim();
    }
    if (typeof dto.descricao === 'string') {
      atividade.descricao = dto.descricao.trim() || null;
    }
    if (typeof dto.dataLimite === 'string') {
      atividade.dataLimite = dto.dataLimite ? new Date(dto.dataLimite) : null;
    }
    if (typeof dto.diaPrescricao === 'number') {
      atividade.diaPrescricao = dto.diaPrescricao;
    }
    if (typeof dto.ordemNoDia === 'number') {
      atividade.ordemNoDia = dto.ordemNoDia;
    }
    if (typeof dto.repetirSemanal === 'boolean') {
      atividade.repetirSemanal = dto.repetirSemanal;
    }

    if (typeof dto.aceiteProfissional === 'boolean') {
      atividade.aceiteProfissional = dto.aceiteProfissional;
      atividade.aceiteProfissionalPorUsuarioId = dto.aceiteProfissional
        ? usuarioId
        : null;
      atividade.aceiteProfissionalEm = dto.aceiteProfissional
        ? new Date()
        : null;
    } else if (hasClinicalChange) {
      atividade.aceiteProfissional = false;
      atividade.aceiteProfissionalPorUsuarioId = null;
      atividade.aceiteProfissionalEm = null;
    }

    return this.atividadeRepository.save(atividade);
  }

  async findMinhasAtividades(usuario: Usuario): Promise<
    Array<
      Atividade & {
        ultimoCheckinEm: Date | null;
        ultimoCheckinConcluiu: boolean | null;
      }
    >
  > {
    if (usuario.role !== UserRole.PACIENTE) {
      throw new ForbiddenException('Acesso permitido somente para pacientes');
    }

    const paciente = await this.pacienteRepository.findOne({
      where: { pacienteUsuarioId: usuario.id, ativo: true },
      order: { updatedAt: 'DESC' },
    });

    if (!paciente) {
      return [];
    }

    const atividades = await this.atividadeRepository.find({
      where: { pacienteId: paciente.id, ativo: true },
      order: { diaPrescricao: 'ASC', ordemNoDia: 'ASC', createdAt: 'DESC' },
    });

    if (!atividades.length) {
      return [];
    }

    const atividadeIds = atividades.map((atividade) => atividade.id);
    const latestRows = await this.checkinRepository
      .createQueryBuilder('checkin')
      .select('checkin.atividade_id', 'atividadeId')
      .addSelect('MAX(checkin.created_at)', 'ultimoCheckinEm')
      .addSelect(
        `(ARRAY_AGG(checkin.concluiu ORDER BY checkin.created_at DESC))[1]`,
        'ultimoCheckinConcluiu',
      )
      .where('checkin.paciente_id = :pacienteId', { pacienteId: paciente.id })
      .andWhere('checkin.atividade_id IN (:...atividadeIds)', { atividadeIds })
      .groupBy('checkin.atividade_id')
      .getRawMany<{
        atividadeId: string;
        ultimoCheckinEm: string | null;
        ultimoCheckinConcluiu: boolean | null;
      }>();

    const latestMap = new Map(
      latestRows.map((row) => [
        row.atividadeId,
        {
          ultimoCheckinEm: row.ultimoCheckinEm
            ? new Date(row.ultimoCheckinEm)
            : null,
          ultimoCheckinConcluiu:
            typeof row.ultimoCheckinConcluiu === 'boolean'
              ? row.ultimoCheckinConcluiu
              : null,
        },
      ]),
    );

    return atividades.map((atividade) => {
      const latest = latestMap.get(atividade.id);
      return Object.assign(atividade, {
        ultimoCheckinEm: latest?.ultimoCheckinEm ?? null,
        ultimoCheckinConcluiu: latest?.ultimoCheckinConcluiu ?? null,
      });
    });
  }

  async createMeuCheckin(
    atividadeId: string,
    dto: CreateAtividadeCheckinDto,
    usuario: Usuario,
  ): Promise<AtividadeCheckin> {
    if (usuario.role !== UserRole.PACIENTE) {
      throw new ForbiddenException('Acesso permitido somente para pacientes');
    }

    const paciente = await this.pacienteRepository.findOne({
      where: { pacienteUsuarioId: usuario.id, ativo: true },
      order: { updatedAt: 'DESC' },
    });
    if (!paciente) {
      throw new NotFoundException('Nenhum cadastro de paciente vinculado');
    }

    const atividade = await this.atividadeRepository.findOne({
      where: { id: atividadeId, pacienteId: paciente.id, ativo: true },
    });
    if (!atividade) {
      throw new NotFoundException('Atividade nao encontrada');
    }

    if (!dto.concluiu && !dto.motivoNaoExecucao?.trim()) {
      throw new BadRequestException(
        'Informe o motivo quando a atividade nao for concluida',
      );
    }

    if (dto.concluiu && !dto.melhoriaSessao) {
      throw new BadRequestException(
        'Informe como foi a melhoria percebida durante a sessao',
      );
    }

    const checkin = this.checkinRepository.create({
      atividadeId: atividade.id,
      pacienteId: paciente.id,
      usuarioId: atividade.usuarioId,
      concluiu: dto.concluiu,
      dorAntes:
        typeof dto.dorAntes === 'number'
          ? Math.max(0, Math.min(10, dto.dorAntes))
          : null,
      dorDepois:
        typeof dto.dorDepois === 'number'
          ? Math.max(0, Math.min(10, dto.dorDepois))
          : null,
      dificuldade: dto.dificuldade ?? null,
      tempoMinutos:
        typeof dto.tempoMinutos === 'number'
          ? Math.max(1, Math.min(300, dto.tempoMinutos))
          : null,
      melhoriaSessao: dto.concluiu ? (dto.melhoriaSessao ?? null) : null,
      melhoriaDescricao: dto.concluiu
        ? dto.melhoriaDescricao?.trim() || null
        : null,
      motivoNaoExecucao: dto.motivoNaoExecucao?.trim() || null,
      feedbackLivre: dto.feedbackLivre?.trim() || null,
    });

    const savedCheckin = await this.checkinRepository.save(checkin);

    this.notificacoesService
      .sendToUsuario(atividade.usuarioId, {
        title: 'Novo check-in de atividade',
        body: dto.concluiu
          ? `${paciente.nomeCompleto} concluiu "${atividade.titulo}".`
          : `${paciente.nomeCompleto} nao concluiu "${atividade.titulo}".`,
        data: {
          type: 'atividade_checkin',
          pacienteId: paciente.id,
          atividadeId: atividade.id,
          checkinId: savedCheckin.id,
        },
      })
      .catch(() => undefined);

    return savedCheckin;
  }

  async findCheckinsByAtividade(
    atividadeId: string,
    usuarioId: string,
  ): Promise<AtividadeCheckin[]> {
    const atividade = await this.atividadeRepository.findOne({
      where: { id: atividadeId, usuarioId, ativo: true },
    });
    if (!atividade) {
      throw new NotFoundException('Atividade nao encontrada');
    }

    return this.checkinRepository.find({
      where: { atividadeId },
      order: { createdAt: 'DESC' },
    });
  }

  async findCheckinsByPaciente(
    pacienteId: string,
    usuarioId: string,
  ): Promise<
    Array<{
      id: string;
      atividadeId: string;
      atividadeTitulo: string;
      concluiu: boolean;
      dorAntes: number | null;
      dorDepois: number | null;
      dificuldade: DificuldadeExecucao | null;
      tempoMinutos: number | null;
      motivoNaoExecucao: string | null;
      feedbackLivre: string | null;
      createdAt: Date;
    }>
  > {
    const paciente = await this.pacienteRepository.findOne({
      where: { id: pacienteId, usuarioId, ativo: true },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente nao encontrado');
    }

    const rows = await this.checkinRepository
      .createQueryBuilder('checkin')
      .innerJoin(Atividade, 'atividade', 'atividade.id = checkin.atividade_id')
      .where('checkin.paciente_id = :pacienteId', { pacienteId })
      .andWhere('checkin.usuario_id = :usuarioId', { usuarioId })
      .orderBy('checkin.created_at', 'DESC')
      .getRawMany<{
        checkin_id: string;
        checkin_atividade_id: string;
        checkin_concluiu: boolean;
        checkin_dor_antes: number | null;
        checkin_dor_depois: number | null;
        checkin_dificuldade: DificuldadeExecucao | null;
        checkin_tempo_minutos: number | null;
        checkin_motivo_nao_execucao: string | null;
        checkin_feedback_livre: string | null;
        checkin_melhoria_sessao: MelhoriaSessao | null;
        checkin_melhoria_descricao: string | null;
        checkin_created_at: Date;
        atividade_titulo: string;
      }>();

    return rows.map((row) => ({
      id: row.checkin_id,
      atividadeId: row.checkin_atividade_id,
      atividadeTitulo: row.atividade_titulo,
      concluiu: row.checkin_concluiu,
      dorAntes: row.checkin_dor_antes,
      dorDepois: row.checkin_dor_depois,
      dificuldade: row.checkin_dificuldade,
      tempoMinutos: row.checkin_tempo_minutos,
      motivoNaoExecucao: row.checkin_motivo_nao_execucao,
      feedbackLivre: row.checkin_feedback_livre,
      melhoriaSessao: row.checkin_melhoria_sessao,
      melhoriaDescricao: row.checkin_melhoria_descricao,
      createdAt: row.checkin_created_at,
    }));
  }

  async findUpdatesByProfissional(
    usuarioId: string,
    options?: { since?: string; limit?: number },
  ): Promise<
    Array<{
      checkinId: string;
      atividadeId: string;
      atividadeTitulo: string;
      pacienteId: string;
      pacienteNome: string;
      concluiu: boolean;
      dorAntes: number | null;
      dorDepois: number | null;
      dificuldade: DificuldadeExecucao | null;
      tempoMinutos: number | null;
      motivoNaoExecucao: string | null;
      melhoriaSessao: MelhoriaSessao | null;
      melhoriaDescricao: string | null;
      createdAt: Date;
    }>
  > {
    const limit = Math.max(1, Math.min(100, options?.limit ?? 30));
    const sinceDate =
      options?.since && !Number.isNaN(new Date(options.since).getTime())
        ? new Date(options.since)
        : null;

    const qb = this.checkinRepository
      .createQueryBuilder('checkin')
      .innerJoin(Atividade, 'atividade', 'atividade.id = checkin.atividade_id')
      .innerJoin(Paciente, 'paciente', 'paciente.id = checkin.paciente_id')
      .where('checkin.usuario_id = :usuarioId', { usuarioId })
      .andWhere('atividade.ativo = :ativoAtividade', { ativoAtividade: true })
      .andWhere('paciente.ativo = :ativoPaciente', { ativoPaciente: true });

    if (sinceDate) {
      qb.andWhere('checkin.created_at > :since', {
        since: sinceDate.toISOString(),
      });
    }

    const rows = await qb
      .orderBy('checkin.created_at', 'DESC')
      .limit(limit)
      .getRawMany<{
        checkin_id: string;
        checkin_atividade_id: string;
        checkin_concluiu: boolean;
        checkin_dor_antes: number | null;
        checkin_dor_depois: number | null;
        checkin_dificuldade: DificuldadeExecucao | null;
        checkin_tempo_minutos: number | null;
        checkin_motivo_nao_execucao: string | null;
        checkin_melhoria_sessao: MelhoriaSessao | null;
        checkin_melhoria_descricao: string | null;
        checkin_created_at: Date;
        atividade_titulo: string;
        paciente_id: string;
        paciente_nome_completo: string;
      }>();

    return rows.map((row) => ({
      checkinId: row.checkin_id,
      atividadeId: row.checkin_atividade_id,
      atividadeTitulo: row.atividade_titulo,
      pacienteId: row.paciente_id,
      pacienteNome: row.paciente_nome_completo,
      concluiu: row.checkin_concluiu,
      dorAntes: row.checkin_dor_antes,
      dorDepois: row.checkin_dor_depois,
      dificuldade: row.checkin_dificuldade,
      tempoMinutos: row.checkin_tempo_minutos,
      motivoNaoExecucao: row.checkin_motivo_nao_execucao,
      melhoriaSessao: row.checkin_melhoria_sessao,
      melhoriaDescricao: row.checkin_melhoria_descricao,
      createdAt: row.checkin_created_at,
    }));
  }

  async generateAiSuggestion(
    dto: GenerateAtividadeAiDto,
    usuarioId: string,
  ): Promise<{
    titulo: string;
    descricao: string;
    referencias?: string[];
    source: 'ai' | 'rules';
    model?: string;
  }> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id: dto.pacienteId, usuarioId, ativo: true },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente nao encontrado');
    }

    const anamnese = await this.anamneseRepository.findOne({
      where: { pacienteId: dto.pacienteId },
      order: { createdAt: 'DESC' },
    });

    const fallback = this.buildRuleSuggestion(dto, anamnese);
    const ai = await this.generateWithOpenAI({
      paciente: {
        nomeCompleto: paciente.nomeCompleto,
        idade: this.getAgeInYears(paciente.dataNascimento),
        sexo: paciente.sexo,
        profissao: paciente.profissao || '',
      },
      anamnese: anamnese
        ? {
            motivoBusca: anamnese.motivoBusca,
            intensidadeDor: anamnese.intensidadeDor,
            descricaoSintomas: anamnese.descricaoSintomas,
            tempoProblema: anamnese.tempoProblema,
            fatorAlivio: anamnese.fatorAlivio,
            limitacoesFuncionais: anamnese.limitacoesFuncionais,
            atividadesQuePioram: anamnese.atividadesQuePioram,
            metaPrincipalPaciente: anamnese.metaPrincipalPaciente,
            qualidadeSono: anamnese.qualidadeSono,
            nivelEstresse: anamnese.nivelEstresse,
            observacoesEstiloVida: anamnese.observacoesEstiloVida,
          }
        : null,
      rascunhoAtual: {
        titulo: dto.titulo || '',
        descricao: dto.descricao || '',
      },
    });

    if (!ai) return fallback;

    const referencias = this.normalizeReferences(ai.referencias);
    const descricaoComReferencias = this.appendReferencesToDescricao(
      ai.descricao || fallback.descricao,
      referencias,
    );

    return {
      titulo: ai.titulo || fallback.titulo,
      descricao: descricaoComReferencias,
      referencias,
      source: 'ai',
      model: ai.model,
    };
  }

  private getAgeInYears(dataNascimento?: Date | null): number | null {
    if (!dataNascimento) return null;
    const birth = new Date(dataNascimento);
    if (Number.isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    const dayDiff = now.getDate() - birth.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }
    return age;
  }

  private extractJsonObject(raw: string): Record<string, unknown> | null {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    const candidate = raw.slice(start, end + 1);
    try {
      return JSON.parse(candidate) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private sanitizeText(value: unknown, maxLen: number): string | undefined {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed.slice(0, maxLen);
  }

  private buildRuleSuggestion(
    dto: GenerateAtividadeAiDto,
    anamnese: Anamnese | null,
  ): {
    titulo: string;
    descricao: string;
    referencias: string[];
    source: 'rules';
  } {
    const objetivo = anamnese?.metaPrincipalPaciente?.trim();
    const limitacoes = anamnese?.limitacoesFuncionais?.trim();
    const piora = anamnese?.atividadesQuePioram?.trim();
    const alivio = anamnese?.fatorAlivio?.trim();

    const titulo =
      dto.titulo?.trim() ||
      (objetivo ? `Plano inicial: ${objetivo}` : 'Plano terapêutico funcional');

    const referencias = this.getDefaultBibliographicReferences().slice(0, 3);
    const descricaoBase =
      dto.descricao?.trim() ||
      [
        'Prescrição sugerida com base na anamnese mais recente.',
        objetivo ? `Meta principal: ${objetivo}.` : undefined,
        limitacoes ? `Limitações funcionais: ${limitacoes}.` : undefined,
        piora ? `Atenção para piora com: ${piora}.` : undefined,
        alivio ? `Estratégias que aliviam: ${alivio}.` : undefined,
        'Executar com progressão gradual e monitorar resposta clínica.',
      ]
        .filter(Boolean)
        .join(' ')
        .slice(0, 1000);
    const descricao = this.appendReferencesToDescricao(
      descricaoBase,
      referencias,
    );

    return {
      titulo: titulo.slice(0, 140),
      descricao,
      referencias,
      source: 'rules',
    };
  }

  private async generateWithOpenAI(input: {
    paciente: {
      nomeCompleto: string;
      idade: number | null;
      sexo: string;
      profissao: string;
    };
    anamnese: Record<string, unknown> | null;
    rascunhoAtual: {
      titulo: string;
      descricao: string;
    };
  }): Promise<{
    titulo?: string;
    descricao?: string;
    referencias?: string[];
    model?: string;
  } | null> {
    const apiKey = (process.env.OPENAI_API_KEY || '').trim();
    if (!apiKey) return null;

    const model = (process.env.OPENAI_ATIVIDADE_MODEL || 'gpt-5-mini').trim();
    const referenciasCanonicas = this.getDefaultBibliographicReferences();
    const systemPrompt =
      'Você é um assistente clínico de fisioterapia tradicional. Gere prescrição de atividade segura, objetiva e executável. Baseie-se em literatura técnica e não invente dados ausentes.';
    const userPrompt = `
Retorne SOMENTE JSON válido com as chaves:
titulo (string até 140 chars),
descricao (string até 1000 chars),
referencias (array de 2 a 4 strings, escolhidas SOMENTE da lista de referências abaixo, sem inventar novas).

Lista de referências permitidas:
${referenciasCanonicas.map((r, index) => `${index + 1}. ${r}`).join('\n')}

Contexto clínico:
${JSON.stringify(input, null, 2)}
`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) return null;

      const data = (await response.json()) as {
        output_text?: string;
        output?: Array<{ content?: Array<{ text?: string }> }>;
      };

      const outputText =
        data.output_text ||
        data.output
          ?.flatMap((item) => item.content || [])
          .map((c) => c.text || '')
          .join('\n') ||
        '';

      const parsed = this.extractJsonObject(outputText);
      if (!parsed) return null;

      return {
        titulo: this.sanitizeText(parsed.titulo, 140),
        descricao: this.sanitizeText(parsed.descricao, 1000),
        referencias: Array.isArray(parsed.referencias)
          ? parsed.referencias
              .filter((item): item is string => typeof item === 'string')
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
        model,
      };
    } catch {
      return null;
    }
  }

  private getDefaultBibliographicReferences(): string[] {
    return [
      'Kisner C, Colby LA, Borstad J. Exercicios terapeuticos: fundamentos e tecnicas.',
      'Hall CM, Brody LT. Exercicio terapeutico: recuperacao funcional.',
      'Magee DJ. Avaliacao musculoesqueletica.',
      'APTA/JOSPT. Clinical Practice Guidelines for Physical Therapy (musculoskeletal conditions).',
      'World Physiotherapy. Standards and policy statements for physiotherapy practice.',
    ];
  }

  private normalizeReferences(referencias?: string[]): string[] {
    const allowed = new Set(this.getDefaultBibliographicReferences());
    if (!referencias?.length)
      return this.getDefaultBibliographicReferences().slice(0, 2);

    const unique = Array.from(
      new Set(
        referencias
          .map((item) => item.trim())
          .filter((item) => allowed.has(item)),
      ),
    );

    if (!unique.length)
      return this.getDefaultBibliographicReferences().slice(0, 2);
    return unique.slice(0, 4);
  }

  private appendReferencesToDescricao(
    descricao: string,
    referencias: string[],
  ): string {
    const base = (descricao || '').trim();
    if (!referencias.length) return base.slice(0, 1000);
    const blocoReferencias = ` Referencias: ${referencias.join(' | ')}`;
    return `${base}${blocoReferencias}`.slice(0, 1000);
  }
}
