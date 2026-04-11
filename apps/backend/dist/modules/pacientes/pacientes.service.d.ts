import { Repository } from 'typeorm';
import { Paciente } from './entities/paciente.entity';
import { PacienteExame } from './entities/paciente-exame.entity';
import { ProfissionalPacienteVinculo } from './entities/profissional-paciente-vinculo.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PacienteProfileResponseDto } from './dto/paciente-profile-response.dto';
export declare class PacientesService {
    private readonly pacienteRepository;
    private readonly evolucaoRepository;
    private readonly laudoRepository;
    private readonly usuarioRepository;
    private readonly pacienteExameRepository;
    private readonly vinculoRepository;
    constructor(pacienteRepository: Repository<Paciente>, evolucaoRepository: Repository<Evolucao>, laudoRepository: Repository<Laudo>, usuarioRepository: Repository<Usuario>, pacienteExameRepository: Repository<PacienteExame>, vinculoRepository: Repository<ProfissionalPacienteVinculo>);
    private resolveInitialVinculoStatus;
    private mapOrigemToVinculo;
    private upsertVinculoAtivo;
    private closeVinculoAtivoByPaciente;
    private validatePacienteUsuarioId;
    create(createPacienteDto: CreatePacienteDto, usuarioId: string): Promise<Paciente>;
    findAll(usuarioId: string): Promise<Paciente[]>;
    findPaged(usuarioId: string, page: number, limit: number): Promise<{
        data: Paciente[];
        total: number;
        page: number;
        limit: number;
        hasNext: boolean;
    }>;
    findOne(id: string, usuarioId: string): Promise<Paciente>;
    update(id: string, updatePacienteDto: UpdatePacienteDto, usuarioId: string): Promise<Paciente>;
    unlinkPacienteUsuarioByProfessional(id: string, usuarioId: string): Promise<Paciente>;
    unlinkMyProfessional(usuario: Usuario): Promise<{
        pacienteId: string;
    }>;
    findLinkedPacienteByUsuarioId(usuarioId: string): Promise<Paciente>;
    remove(id: string, usuarioId: string): Promise<void>;
    getAttentionMap(usuarioId: string): Promise<Record<string, number | null>>;
    getStats(usuarioId: string): Promise<{
        totalPacientes: number;
        atendidosHoje: number;
        atendidosMes: number;
    }>;
    getMyPacienteProfile(usuario: Usuario): Promise<PacienteProfileResponseDto>;
    listExames(pacienteId: string, usuarioId: string): Promise<PacienteExame[]>;
    createExame(pacienteId: string, usuarioId: string, payload: {
        nomeOriginal: string;
        nomeArquivo: string;
        mimeType: string;
        tamanhoBytes: number;
        caminhoArquivo: string;
        tipoExame?: string;
        observacao?: string;
        dataExame?: Date | null;
    }): Promise<PacienteExame>;
    findExameOrFail(pacienteId: string, exameId: string, usuarioId: string): Promise<PacienteExame>;
    removeExame(pacienteId: string, exameId: string, usuarioId: string): Promise<void>;
}
