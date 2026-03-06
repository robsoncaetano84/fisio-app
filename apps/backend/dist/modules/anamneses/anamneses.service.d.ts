import { Repository } from 'typeorm';
import { Anamnese } from './entities/anamnese.entity';
import { CreateAnamneseDto } from './dto/create-anamnese.dto';
import { UpdateAnamneseDto } from './dto/update-anamnese.dto';
import { PacientesService } from '../pacientes/pacientes.service';
export declare class AnamnesesService {
    private readonly anamneseRepository;
    private readonly pacientesService;
    constructor(anamneseRepository: Repository<Anamnese>, pacientesService: PacientesService);
    create(createAnamneseDto: CreateAnamneseDto, usuarioId: string): Promise<Anamnese>;
    findAllByPaciente(pacienteId: string, usuarioId: string): Promise<Anamnese[]>;
    findOne(id: string, usuarioId: string): Promise<Anamnese>;
    update(id: string, updateAnamneseDto: UpdateAnamneseDto, usuarioId: string): Promise<Anamnese>;
    remove(id: string, usuarioId: string): Promise<void>;
}
