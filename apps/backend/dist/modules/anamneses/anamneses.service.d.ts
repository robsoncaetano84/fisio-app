import { Repository } from 'typeorm';
import { Anamnese } from './entities/anamnese.entity';
import { AnamneseHistorico } from './entities/anamnese-historico.entity';
import { CreateAnamneseDto } from './dto/create-anamnese.dto';
import { UpdateAnamneseDto } from './dto/update-anamnese.dto';
import { PacientesService } from '../pacientes/pacientes.service';
export declare class AnamnesesService {
    private readonly anamneseRepository;
    private readonly anamneseHistoricoRepository;
    private readonly pacientesService;
    constructor(anamneseRepository: Repository<Anamnese>, anamneseHistoricoRepository: Repository<AnamneseHistorico>, pacientesService: PacientesService);
    create(createAnamneseDto: CreateAnamneseDto, usuarioId: string): Promise<Anamnese>;
    createForPacienteUsuario(createAnamneseDto: Omit<CreateAnamneseDto, 'pacienteId'>, usuarioId: string): Promise<Anamnese>;
    findAllByPaciente(pacienteId: string, usuarioId: string): Promise<Anamnese[]>;
    findLatestByPacienteUsuario(usuarioId: string): Promise<Anamnese | null>;
    findOne(id: string, usuarioId: string): Promise<Anamnese>;
    findOneByPacienteUsuario(id: string, usuarioId: string): Promise<Anamnese>;
    update(id: string, updateAnamneseDto: UpdateAnamneseDto, usuarioId: string): Promise<Anamnese>;
    updateByPacienteUsuario(id: string, updateAnamneseDto: UpdateAnamneseDto, usuarioId: string): Promise<Anamnese>;
    findHistoryByAnamnese(anamneseId: string, usuarioId: string, limit?: number): Promise<AnamneseHistorico[]>;
    findHistoryByPaciente(pacienteId: string, usuarioId: string, limit?: number): Promise<AnamneseHistorico[]>;
    findHistoryByPacienteUsuario(usuarioId: string, limit?: number): Promise<AnamneseHistorico[]>;
    remove(id: string, usuarioId: string): Promise<void>;
    private validateClinicalMinimum;
    private registrarHistorico;
    private buildSnapshotPayload;
    private normalizeLimit;
}
