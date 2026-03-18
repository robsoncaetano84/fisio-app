// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// A TI VI DA DE S.S ER VI CE
// ==========================================
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Atividade } from './entities/atividade.entity';
import {
  AtividadeCheckin,
  DificuldadeExecucao,
} from './entities/atividade-checkin.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { CreateAtividadeCheckinDto } from './dto/create-atividade-checkin.dto';
import { DuplicateAtividadeDto } from './dto/duplicate-atividade.dto';
import { DuplicateAtividadesBatchDto } from './dto/duplicate-atividades-batch.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
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
      diaPrescricao: typeof dto.diaPrescricao === 'number' ? dto.diaPrescricao : null,
      ordemNoDia: typeof dto.ordemNoDia === 'number' ? dto.ordemNoDia : null,
      repetirSemanal: dto.repetirSemanal ?? true,
      ativo: true,
    });

    return this.atividadeRepository.save(atividade);
  }

  async findByPaciente(pacienteId: string, usuarioId: string): Promise<Atividade[]> {
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

    return this.atividadeRepository.save(atividade);
  }

  async findMinhasAtividades(
    usuario: Usuario,
  ): Promise<
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
          ultimoCheckinEm: row.ultimoCheckinEm ? new Date(row.ultimoCheckinEm) : null,
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

    const checkin = this.checkinRepository.create({
      atividadeId: atividade.id,
      pacienteId: paciente.id,
      usuarioId: atividade.usuarioId,
      concluiu: dto.concluiu,
      dorAntes:
        typeof dto.dorAntes === 'number' ? Math.max(0, Math.min(10, dto.dorAntes)) : null,
      dorDepois:
        typeof dto.dorDepois === 'number' ? Math.max(0, Math.min(10, dto.dorDepois)) : null,
      dificuldade: dto.dificuldade ?? null,
      tempoMinutos:
        typeof dto.tempoMinutos === 'number'
          ? Math.max(1, Math.min(300, dto.tempoMinutos))
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
      qb.andWhere('checkin.created_at > :since', { since: sinceDate.toISOString() });
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
      createdAt: row.checkin_created_at,
    }));
  }
}
