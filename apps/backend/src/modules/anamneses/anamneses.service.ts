// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// A NA MN ES ES.S ER VI CE
// ==========================================
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Anamnese, MotivoBusca } from './entities/anamnese.entity';
import { CreateAnamneseDto } from './dto/create-anamnese.dto';
import { UpdateAnamneseDto } from './dto/update-anamnese.dto';
import { PacientesService } from '../pacientes/pacientes.service';

@Injectable()
export class AnamnesesService {  constructor(
    @InjectRepository(Anamnese)
    private readonly anamneseRepository: Repository<Anamnese>,
    private readonly pacientesService: PacientesService,
  ) {}

  async create(
    createAnamneseDto: CreateAnamneseDto,
    usuarioId: string,
  ): Promise<Anamnese> {
    await this.pacientesService.findOne(createAnamneseDto.pacienteId, usuarioId);
    this.validateClinicalMinimum(createAnamneseDto);
    const anamnese = this.anamneseRepository.create(createAnamneseDto);
    return this.anamneseRepository.save(anamnese);
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

    return this.anamneseRepository.save(anamnese);
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
    return this.anamneseRepository.save(anamnese);
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
    return this.anamneseRepository.save(anamnese);
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
}



