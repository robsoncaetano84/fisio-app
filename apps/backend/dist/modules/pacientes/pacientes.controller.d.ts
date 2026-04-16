import type { Response } from 'express';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PacienteProfileResponseDto } from './dto/paciente-profile-response.dto';
import { CreatePacienteExameDto } from './dto/create-paciente-exame.dto';
export declare class PacientesController {
    private readonly pacientesService;
    constructor(pacientesService: PacientesService);
    private toExameResponse;
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
    listExames(id: string, usuario: Usuario): Promise<{
        id: string;
        pacienteId: string;
        nomeOriginal: string;
        mimeType: string;
        tamanhoBytes: number;
        tipoExame: string | null;
        observacao: string | null;
        dataExame: Date | null;
        createdAt: Date;
        updatedAt: Date;
        downloadUrl: string;
    }[]>;
    uploadExame(id: string, file: {
        originalname: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
    }, body: CreatePacienteExameDto, usuario: Usuario): Promise<{
        id: string;
        pacienteId: string;
        nomeOriginal: string;
        mimeType: string;
        tamanhoBytes: number;
        tipoExame: string | null;
        observacao: string | null;
        dataExame: Date | null;
        createdAt: Date;
        updatedAt: Date;
        downloadUrl: string;
    }>;
    downloadExame(id: string, exameId: string, usuario: Usuario, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteExame(id: string, exameId: string, usuario: Usuario): Promise<{
        success: boolean;
    }>;
    findOne(id: string, usuario: Usuario): Promise<import("./entities/paciente.entity").Paciente>;
    update(id: string, updatePacienteDto: UpdatePacienteDto, usuario: Usuario): Promise<import("./entities/paciente.entity").Paciente>;
    unlinkPacienteUsuario(id: string, usuario: Usuario): Promise<import("./entities/paciente.entity").Paciente>;
    remove(id: string, usuario: Usuario): Promise<void>;
}
