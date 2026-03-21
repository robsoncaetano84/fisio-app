// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// E VO LU CO ES.S ER VI CE
// ==========================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evolucao } from './entities/evolucao.entity';
import { CreateEvolucaoDto } from './dto/create-evolucao.dto';
import { UpdateEvolucaoDto } from './dto/update-evolucao.dto';
import { PacientesService } from '../pacientes/pacientes.service';

@Injectable()
export class EvolucoesService {
  constructor(
    @InjectRepository(Evolucao)
    private readonly evolucaoRepository: Repository<Evolucao>,
    private readonly pacientesService: PacientesService,
  ) {}

  private normalizeFields(
    payload: Partial<CreateEvolucaoDto | UpdateEvolucaoDto>,
  ): Pick<Evolucao, 'subjetivo' | 'objetivo' | 'avaliacao' | 'plano'> {
    return {
      subjetivo: payload.subjetivo ?? payload.listagens ?? null,
      objetivo: payload.objetivo ?? payload.legCheck ?? null,
      avaliacao: payload.avaliacao ?? payload.ajustes ?? null,
      plano: payload.plano ?? payload.orientacoes ?? null,
    } as Pick<Evolucao, 'subjetivo' | 'objetivo' | 'avaliacao' | 'plano'>;
  }

  async create(
    createEvolucaoDto: CreateEvolucaoDto,
    usuarioId: string,
  ): Promise<Evolucao> {
    await this.pacientesService.findOne(
      createEvolucaoDto.pacienteId,
      usuarioId,
    );

    const evolucao = this.evolucaoRepository.create({
      pacienteId: createEvolucaoDto.pacienteId,
      data: createEvolucaoDto.data
        ? new Date(createEvolucaoDto.data)
        : new Date(),
      ...this.normalizeFields(createEvolucaoDto),
      checkinDor: createEvolucaoDto.checkinDor,
      checkinDificuldade: createEvolucaoDto.checkinDificuldade,
      checkinObservacao: createEvolucaoDto.checkinObservacao,
      dorStatus: createEvolucaoDto.dorStatus,
      funcaoStatus: createEvolucaoDto.funcaoStatus,
      adesaoStatus: createEvolucaoDto.adesaoStatus,
      statusEvolucao: createEvolucaoDto.statusEvolucao,
      condutaStatus: createEvolucaoDto.condutaStatus,
      observacoes: createEvolucaoDto.observacoes,
    });

    return this.evolucaoRepository.save(evolucao);
  }

  async findAllByPaciente(
    pacienteId: string,
    usuarioId: string,
  ): Promise<Evolucao[]> {
    await this.pacientesService.findOne(pacienteId, usuarioId);

    return this.evolucaoRepository.find({
      where: { pacienteId },
      order: { data: 'DESC' },
    });
  }

  async findOne(id: string, usuarioId: string): Promise<Evolucao> {
    const evolucao = await this.evolucaoRepository.findOne({
      where: { id },
      relations: ['paciente'],
    });

    if (!evolucao) {
      throw new NotFoundException('Evolucao nao encontrada');
    }

    if (evolucao.paciente.usuarioId !== usuarioId) {
      throw new NotFoundException('Evolucao nao encontrada');
    }

    return evolucao;
  }

  async update(
    id: string,
    updateEvolucaoDto: UpdateEvolucaoDto,
    usuarioId: string,
  ): Promise<Evolucao> {
    const evolucao = await this.findOne(id, usuarioId);

    if (updateEvolucaoDto.data) {
      evolucao.data = new Date(updateEvolucaoDto.data);
    }

    const normalized = this.normalizeFields(updateEvolucaoDto);
    if (normalized.subjetivo !== null) evolucao.subjetivo = normalized.subjetivo;
    if (normalized.objetivo !== null) evolucao.objetivo = normalized.objetivo;
    if (normalized.avaliacao !== null) evolucao.avaliacao = normalized.avaliacao;
    if (normalized.plano !== null) evolucao.plano = normalized.plano;

    Object.assign(evolucao, {
      checkinDor: updateEvolucaoDto.checkinDor ?? evolucao.checkinDor,
      checkinDificuldade:
        updateEvolucaoDto.checkinDificuldade ?? evolucao.checkinDificuldade,
      checkinObservacao:
        updateEvolucaoDto.checkinObservacao ?? evolucao.checkinObservacao,
      dorStatus: updateEvolucaoDto.dorStatus ?? evolucao.dorStatus,
      funcaoStatus: updateEvolucaoDto.funcaoStatus ?? evolucao.funcaoStatus,
      adesaoStatus: updateEvolucaoDto.adesaoStatus ?? evolucao.adesaoStatus,
      statusEvolucao: updateEvolucaoDto.statusEvolucao ?? evolucao.statusEvolucao,
      condutaStatus: updateEvolucaoDto.condutaStatus ?? evolucao.condutaStatus,
      observacoes: updateEvolucaoDto.observacoes ?? evolucao.observacoes,
    });

    return this.evolucaoRepository.save(evolucao);
  }

  async remove(id: string, usuarioId: string): Promise<void> {
    const evolucao = await this.findOne(id, usuarioId);
    await this.evolucaoRepository.remove(evolucao);
  }
}
