import { AnamnesesService } from './anamneses.service';
import { CreateAnamneseDto } from './dto/create-anamnese.dto';
import { UpdateAnamneseDto } from './dto/update-anamnese.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
export declare class AnamnesesController {
    private readonly anamnesesService;
    constructor(anamnesesService: AnamnesesService);
    create(createAnamneseDto: CreateAnamneseDto, usuario: Usuario): Promise<import("./entities/anamnese.entity").Anamnese>;
    findAllByPaciente(pacienteId: string, usuario: Usuario): Promise<import("./entities/anamnese.entity").Anamnese[]>;
    findOne(id: string, usuario: Usuario): Promise<import("./entities/anamnese.entity").Anamnese>;
    update(id: string, updateAnamneseDto: UpdateAnamneseDto, usuario: Usuario): Promise<import("./entities/anamnese.entity").Anamnese>;
    remove(id: string, usuario: Usuario): Promise<void>;
}
