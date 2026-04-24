import { AnamnesesService } from './anamneses.service';
import { CreateAnamneseDto } from './dto/create-anamnese.dto';
import { UpdateAnamneseDto } from './dto/update-anamnese.dto';
import { CreateMyAnamneseDto } from './dto/create-my-anamnese.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
export declare class AnamnesesController {
    private readonly anamnesesService;
    constructor(anamnesesService: AnamnesesService);
    create(createAnamneseDto: CreateAnamneseDto, usuario: Usuario): Promise<import("./entities/anamnese.entity").Anamnese>;
    findAllByPaciente(pacienteId: string, usuario: Usuario): Promise<import("./entities/anamnese.entity").Anamnese[]>;
    findHistoryByPaciente(pacienteId: string, limitRaw: string | undefined, usuario: Usuario): Promise<import("./entities/anamnese-historico.entity").AnamneseHistorico[]>;
    findMyLatest(usuario: Usuario): Promise<import("./entities/anamnese.entity").Anamnese | null>;
    findMyHistory(limitRaw: string | undefined, usuario: Usuario): Promise<import("./entities/anamnese-historico.entity").AnamneseHistorico[]>;
    createMy(createMyAnamneseDto: CreateMyAnamneseDto, usuario: Usuario): Promise<import("./entities/anamnese.entity").Anamnese>;
    findOne(id: string, usuario: Usuario): Promise<import("./entities/anamnese.entity").Anamnese>;
    findHistoryByAnamnese(id: string, limitRaw: string | undefined, usuario: Usuario): Promise<import("./entities/anamnese-historico.entity").AnamneseHistorico[]>;
    updateMy(id: string, updateAnamneseDto: UpdateAnamneseDto, usuario: Usuario): Promise<import("./entities/anamnese.entity").Anamnese>;
    update(id: string, updateAnamneseDto: UpdateAnamneseDto, usuario: Usuario): Promise<import("./entities/anamnese.entity").Anamnese>;
    remove(id: string, usuario: Usuario): Promise<void>;
}
