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

  async create(
    createEvolucaoDto: CreateEvolucaoDto,
    usuarioId: string,
  ): Promise<Evolucao> {
    await this.pacientesService.findOne(
      createEvolucaoDto.pacienteId,
      usuarioId,
    );

    const evolucao = this.evolucaoRepository.create({
      ...createEvolucaoDto,
      data: createEvolucaoDto.data
        ? new Date(createEvolucaoDto.data)
        : new Date(),
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
    Object.assign(evolucao, updateEvolucaoDto);
    return this.evolucaoRepository.save(evolucao);
  }

  async remove(id: string, usuarioId: string): Promise<void> {
    const evolucao = await this.findOne(id, usuarioId);
    await this.evolucaoRepository.remove(evolucao);
  }
}
