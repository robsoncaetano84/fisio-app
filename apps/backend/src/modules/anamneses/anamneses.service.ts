// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// A NA MN ES ES.S ER VI CE
// ==========================================
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Anamnese, MotivoBusca } from './entities/anamnese.entity';
import {
  AnamneseHistorico,
  AnamneseHistoricoAcao,
  AnamneseHistoricoOrigem,
} from './entities/anamnese-historico.entity';
import { CreateAnamneseDto } from './dto/create-anamnese.dto';
import { UpdateAnamneseDto } from './dto/update-anamnese.dto';
import { PacientesService } from '../pacientes/pacientes.service';

@Injectable()
export class AnamnesesService {
  constructor(
    @InjectRepository(Anamnese)
    private readonly anamneseRepository: Repository<Anamnese>,
    @InjectRepository(AnamneseHistorico)
    private readonly anamneseHistoricoRepository: Repository<AnamneseHistorico>,
    private readonly pacientesService: PacientesService,
  ) {}

  async create(
    createAnamneseDto: CreateAnamneseDto,
    usuarioId: string,
  ): Promise<Anamnese> {
    await this.pacientesService.findOne(createAnamneseDto.pacienteId, usuarioId);
    this.validateClinicalMinimum(createAnamneseDto);
    const anamnese = this.anamneseRepository.create(createAnamneseDto);
    const saved = await this.anamneseRepository.save(anamnese);
    await this.registrarHistorico(
      saved,
      usuarioId,
      AnamneseHistoricoAcao.CREATE,
      AnamneseHistoricoOrigem.PROFISSIONAL,
    );
    return saved;
  }

  async createForPacienteUsuario(
    createAnamneseDto: Omit<CreateAnamneseDto, 'pacienteId'>,
    usuarioId: string,
  ): Promise<Anamnese> {
    const paciente = await this.pacientesService.findOrCreateSelfPacienteForUsuario(
      usuarioId,
    );

    this.validateClinicalMinimum(createAnamneseDto);
    const anamnese = this.anamneseRepository.create({
      ...createAnamneseDto,
      pacienteId: paciente.id,
    });

    const saved = await this.anamneseRepository.save(anamnese);
    await this.registrarHistorico(
      saved,
      usuarioId,
      AnamneseHistoricoAcao.CREATE,
      AnamneseHistoricoOrigem.PACIENTE,
    );
    return saved;
  }

  async findAllByPaciente(
    pacienteId: string,
    usuarioId: string,
  ): Promise<Anamnese[]> {
    await this.pacientesService.findOne(pacienteId, usuarioId);
    return this.anamneseRepository.find({
      where: { pacienteId },
      order: { createdAt: 'DESC' },
    });
  }

  async findLatestByPacienteUsuario(usuarioId: string): Promise<Anamnese | null> {
    const paciente = await this.pacientesService.findOrCreateSelfPacienteForUsuario(
      usuarioId,
    );

    return this.anamneseRepository.findOne({
      where: { pacienteId: paciente.id },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, usuarioId: string): Promise<Anamnese> {
    const anamnese = await this.anamneseRepository.findOne({
      where: { id },
      relations: ['paciente'],
    });

    if (!anamnese) {
      throw new NotFoundException('Anamnese não encontrada');
    }

    const isMasterAdmin = await this.pacientesService.isMasterAdminByUsuarioId(
      usuarioId,
    );
    if (!isMasterAdmin && anamnese.paciente.usuarioId !== usuarioId) {
      throw new NotFoundException('Anamnese não encontrada');
    }

    return anamnese;
  }

  async findOneByPacienteUsuario(
    id: string,
    usuarioId: string,
  ): Promise<Anamnese> {
    const paciente = await this.pacientesService.findOrCreateSelfPacienteForUsuario(
      usuarioId,
    );

    const anamnese = await this.anamneseRepository.findOne({
      where: { id, pacienteId: paciente.id },
    });

    if (!anamnese) {
      throw new NotFoundException('Anamnese não encontrada');
    }

    return anamnese;
  }

  async update(
    id: string,
    updateAnamneseDto: UpdateAnamneseDto,
    usuarioId: string,
  ): Promise<Anamnese> {
    const anamnese = await this.findOne(id, usuarioId);
    const nextPayload = { ...anamnese, ...updateAnamneseDto };
    this.validateClinicalMinimum(nextPayload);
    Object.assign(anamnese, updateAnamneseDto);
    const saved = await this.anamneseRepository.save(anamnese);
    await this.registrarHistorico(
      saved,
      usuarioId,
      AnamneseHistoricoAcao.UPDATE,
      AnamneseHistoricoOrigem.PROFISSIONAL,
    );
    return saved;
  }

  async updateByPacienteUsuario(
    id: string,
    updateAnamneseDto: UpdateAnamneseDto,
    usuarioId: string,
  ): Promise<Anamnese> {
    const anamnese = await this.findOneByPacienteUsuario(id, usuarioId);
    const nextPayload = { ...anamnese, ...updateAnamneseDto };
    this.validateClinicalMinimum(nextPayload);
    Object.assign(anamnese, updateAnamneseDto);
    const saved = await this.anamneseRepository.save(anamnese);
    await this.registrarHistorico(
      saved,
      usuarioId,
      AnamneseHistoricoAcao.UPDATE,
      AnamneseHistoricoOrigem.PACIENTE,
    );
    return saved;
  }

  async findHistoryByAnamnese(
    anamneseId: string,
    usuarioId: string,
    limit = 20,
  ): Promise<AnamneseHistorico[]> {
    await this.findOne(anamneseId, usuarioId);
    const normalizedLimit = this.normalizeLimit(limit, 20, 100);
    return this.anamneseHistoricoRepository.find({
      where: { anamneseId },
      order: { revisao: 'DESC' },
      take: normalizedLimit,
    });
  }

  async findHistoryByPaciente(
    pacienteId: string,
    usuarioId: string,
    limit = 50,
  ): Promise<AnamneseHistorico[]> {
    await this.pacientesService.findOne(pacienteId, usuarioId);
    const normalizedLimit = this.normalizeLimit(limit, 50, 200);
    return this.anamneseHistoricoRepository.find({
      where: { pacienteId },
      order: { createdAt: 'DESC' },
      take: normalizedLimit,
    });
  }

  async findHistoryByPacienteUsuario(
    usuarioId: string,
    limit = 50,
  ): Promise<AnamneseHistorico[]> {
    const paciente = await this.pacientesService.findOrCreateSelfPacienteForUsuario(
      usuarioId,
    );
    const normalizedLimit = this.normalizeLimit(limit, 50, 200);

    return this.anamneseHistoricoRepository.find({
      where: { pacienteId: paciente.id },
      order: { createdAt: 'DESC' },
      take: normalizedLimit,
    });
  }

  async remove(id: string, usuarioId: string): Promise<void> {
    const anamnese = await this.findOne(id, usuarioId);
    await this.anamneseRepository.remove(anamnese);
  }

  private validateClinicalMinimum(
    payload: Partial<CreateAnamneseDto> | Partial<UpdateAnamneseDto> | Partial<Anamnese>,
  ): void {
    if (payload.motivoBusca !== MotivoBusca.SINTOMA_EXISTENTE) return;

    const missing: string[] = [];
    if (!payload.inicioProblema) missing.push('inicioProblema');
    if (!payload.mecanismoLesao) missing.push('mecanismoLesao');
    if (!String(payload.fatorAlivio || '').trim()) missing.push('fatorAlivio');
    if (!String(payload.fatoresPiora || '').trim()) missing.push('fatoresPiora');

    if (missing.length > 0) {
      throw new BadRequestException(
        `Campos obrigatorios ausentes para motivo SINTOMA_EXISTENTE: ${missing.join(', ')}`,
      );
    }
  }

  private async registrarHistorico(
    anamnese: Anamnese,
    usuarioId: string | null,
    acao: AnamneseHistoricoAcao,
    origem: AnamneseHistoricoOrigem,
  ): Promise<void> {
    const ultimo = await this.anamneseHistoricoRepository.findOne({
      where: { anamneseId: anamnese.id },
      order: { revisao: 'DESC' },
      select: ['id', 'revisao'],
    });

    const payload = this.buildSnapshotPayload(anamnese);

    const historico = this.anamneseHistoricoRepository.create({
      anamneseId: anamnese.id,
      pacienteId: anamnese.pacienteId,
      revisao: (ultimo?.revisao || 0) + 1,
      acao,
      origem,
      alteradoPorUsuarioId: usuarioId || null,
      payload,
    });

    await this.anamneseHistoricoRepository.save(historico);
  }

  private buildSnapshotPayload(anamnese: Anamnese): Record<string, unknown> {
    const {
      id,
      pacienteId,
      createdAt,
      updatedAt,
      ...campos
    } = anamnese as unknown as Record<string, unknown>;

    return {
      anamneseId: id,
      pacienteId,
      createdAt,
      updatedAt,
      campos,
    };
  }

  private normalizeLimit(value: number, fallback: number, max: number): number {
    if (!Number.isFinite(value)) return fallback;
    const integer = Math.floor(value);
    if (integer < 1) return 1;
    if (integer > max) return max;
    return integer;
  }
}

