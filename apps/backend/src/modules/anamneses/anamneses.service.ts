// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// A NA MN ES ES.S ER VI CE
// ==========================================
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Anamnese } from './entities/anamnese.entity';
import { CreateAnamneseDto } from './dto/create-anamnese.dto';
import { UpdateAnamneseDto } from './dto/update-anamnese.dto';
import { PacientesService } from '../pacientes/pacientes.service';

@Injectable()
export class AnamnesesService {
  private ensurePacienteCanFillOwnAnamnese(anamneseLiberadaPaciente: boolean): void {
    if (!anamneseLiberadaPaciente) {
      throw new ForbiddenException('Preenchimento de anamnese nao liberado pelo profissional');
    }
  }
  constructor(
    @InjectRepository(Anamnese)
    private readonly anamneseRepository: Repository<Anamnese>,
    private readonly pacientesService: PacientesService,
  ) {}

  async create(
    createAnamneseDto: CreateAnamneseDto,
    usuarioId: string,
  ): Promise<Anamnese> {
    await this.pacientesService.findOne(createAnamneseDto.pacienteId, usuarioId);
    const anamnese = this.anamneseRepository.create(createAnamneseDto);
    return this.anamneseRepository.save(anamnese);
  }

  async createForPacienteUsuario(
    createAnamneseDto: Omit<CreateAnamneseDto, 'pacienteId'>,
    usuarioId: string,
  ): Promise<Anamnese> {
    const paciente = await this.pacientesService.findLinkedPacienteByUsuarioId(
      usuarioId,
    );

    this.ensurePacienteCanFillOwnAnamnese(paciente.anamneseLiberadaPaciente);

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
    const paciente = await this.pacientesService.findLinkedPacienteByUsuarioId(
      usuarioId,
    );

    this.ensurePacienteCanFillOwnAnamnese(paciente.anamneseLiberadaPaciente);

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
      throw new NotFoundException('Anamnese n�o encontrada');
    }

    if (anamnese.paciente.usuarioId !== usuarioId) {
      throw new NotFoundException('Anamnese n�o encontrada');
    }

    return anamnese;
  }

  async findOneByPacienteUsuario(
    id: string,
    usuarioId: string,
  ): Promise<Anamnese> {
    const paciente = await this.pacientesService.findLinkedPacienteByUsuarioId(
      usuarioId,
    );

    this.ensurePacienteCanFillOwnAnamnese(paciente.anamneseLiberadaPaciente);

    const anamnese = await this.anamneseRepository.findOne({
      where: { id, pacienteId: paciente.id },
    });

    if (!anamnese) {
      throw new NotFoundException('Anamnese n�o encontrada');
    }

    return anamnese;
  }

  async update(
    id: string,
    updateAnamneseDto: UpdateAnamneseDto,
    usuarioId: string,
  ): Promise<Anamnese> {
    const anamnese = await this.findOne(id, usuarioId);
    Object.assign(anamnese, updateAnamneseDto);
    return this.anamneseRepository.save(anamnese);
  }

  async updateByPacienteUsuario(
    id: string,
    updateAnamneseDto: UpdateAnamneseDto,
    usuarioId: string,
  ): Promise<Anamnese> {
    const anamnese = await this.findOneByPacienteUsuario(id, usuarioId);
    Object.assign(anamnese, updateAnamneseDto);
    return this.anamneseRepository.save(anamnese);
  }

  async remove(id: string, usuarioId: string): Promise<void> {
    const anamnese = await this.findOne(id, usuarioId);
    await this.anamneseRepository.remove(anamnese);
  }
}
