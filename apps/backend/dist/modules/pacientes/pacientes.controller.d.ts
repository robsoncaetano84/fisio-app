import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PacienteProfileResponseDto } from './dto/paciente-profile-response.dto';
export declare class PacientesController {
    private readonly pacientesService;
    constructor(pacientesService: PacientesService);
    create(createPacienteDto: CreatePacienteDto, usuario: Usuario): Promise<import("./entities/paciente.entity").Paciente>;
    findAll(usuario: Usuario): Promise<import("./entities/paciente.entity").Paciente[]>;
    findPaged(usuario: Usuario, page: number, limit: number): Promise<{
        data: import("./entities/paciente.entity").Paciente[];
        total: number;
        page: number;
        limit: number;
        hasNext: boolean;
    }>;
    getAttention(usuario: Usuario): Promise<Record<string, number | null>>;
    getStats(usuario: Usuario): Promise<{
        totalPacientes: number;
        atendidosHoje: number;
        atendidosMes: number;
    }>;
    getMyPacienteProfile(usuario: Usuario): Promise<PacienteProfileResponseDto>;
    unlinkMyProfessional(usuario: Usuario): Promise<{
        pacienteId: string;
    }>;
    findOne(id: string, usuario: Usuario): Promise<import("./entities/paciente.entity").Paciente>;
    update(id: string, updatePacienteDto: UpdatePacienteDto, usuario: Usuario): Promise<import("./entities/paciente.entity").Paciente>;
    unlinkPacienteUsuario(id: string, usuario: Usuario): Promise<import("./entities/paciente.entity").Paciente>;
    remove(id: string, usuario: Usuario): Promise<void>;
}
