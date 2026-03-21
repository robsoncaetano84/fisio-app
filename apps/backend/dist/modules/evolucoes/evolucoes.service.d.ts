import { Repository } from 'typeorm';
import { Evolucao } from './entities/evolucao.entity';
import { CreateEvolucaoDto } from './dto/create-evolucao.dto';
import { UpdateEvolucaoDto } from './dto/update-evolucao.dto';
import { PacientesService } from '../pacientes/pacientes.service';
export declare class EvolucoesService {
    private readonly evolucaoRepository;
    private readonly pacientesService;
    constructor(evolucaoRepository: Repository<Evolucao>, pacientesService: PacientesService);
    private normalizeFields;
    create(createEvolucaoDto: CreateEvolucaoDto, usuarioId: string): Promise<Evolucao>;
    findAllByPaciente(pacienteId: string, usuarioId: string): Promise<Evolucao[]>;
    findOne(id: string, usuarioId: string): Promise<Evolucao>;
    update(id: string, updateEvolucaoDto: UpdateEvolucaoDto, usuarioId: string): Promise<Evolucao>;
    remove(id: string, usuarioId: string): Promise<void>;
}
