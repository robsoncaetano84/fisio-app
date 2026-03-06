import { EvolucoesService } from './evolucoes.service';
import { CreateEvolucaoDto } from './dto/create-evolucao.dto';
import { UpdateEvolucaoDto } from './dto/update-evolucao.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
export declare class EvolucoesController {
    private readonly evolucoesService;
    constructor(evolucoesService: EvolucoesService);
    create(createEvolucaoDto: CreateEvolucaoDto, usuario: Usuario): Promise<import("./entities/evolucao.entity").Evolucao>;
    findAllByPaciente(pacienteId: string, usuario: Usuario): Promise<import("./entities/evolucao.entity").Evolucao[]>;
    findOne(id: string, usuario: Usuario): Promise<import("./entities/evolucao.entity").Evolucao>;
    update(id: string, updateEvolucaoDto: UpdateEvolucaoDto, usuario: Usuario): Promise<import("./entities/evolucao.entity").Evolucao>;
    remove(id: string, usuario: Usuario): Promise<void>;
}
