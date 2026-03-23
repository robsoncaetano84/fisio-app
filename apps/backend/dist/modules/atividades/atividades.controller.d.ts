import { Usuario } from '../usuarios/entities/usuario.entity';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { CreateAtividadeCheckinDto } from './dto/create-atividade-checkin.dto';
import { DuplicateAtividadeDto } from './dto/duplicate-atividade.dto';
import { DuplicateAtividadesBatchDto } from './dto/duplicate-atividades-batch.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { GenerateAtividadeAiDto } from './dto/generate-atividade-ai.dto';
import { AtividadesService } from './atividades.service';
export declare class AtividadesController {
    private readonly atividadesService;
    constructor(atividadesService: AtividadesService);
    generateAiSuggestion(dto: GenerateAtividadeAiDto, usuario: Usuario): Promise<{
        titulo: string;
        descricao: string;
        referencias?: string[];
        source: "ai" | "rules";
        model?: string;
    }>;
    create(dto: CreateAtividadeDto, usuario: Usuario): Promise<import("./entities/atividade.entity").Atividade>;
    findByPaciente(pacienteId: string, usuario: Usuario): Promise<import("./entities/atividade.entity").Atividade[]>;
    inativar(atividadeId: string, usuario: Usuario): Promise<{
        success: true;
    }>;
    duplicar(atividadeId: string, dto: DuplicateAtividadeDto, usuario: Usuario): Promise<import("./entities/atividade.entity").Atividade>;
    duplicarLote(dto: DuplicateAtividadesBatchDto, usuario: Usuario): Promise<{
        total: number;
    }>;
    update(atividadeId: string, dto: UpdateAtividadeDto, usuario: Usuario): Promise<import("./entities/atividade.entity").Atividade>;
    findMinhas(usuario: Usuario): Promise<(import("./entities/atividade.entity").Atividade & {
        ultimoCheckinEm: Date | null;
        ultimoCheckinConcluiu: boolean | null;
    })[]>;
    findCheckinsByPaciente(pacienteId: string, usuario: Usuario): Promise<{
        id: string;
        atividadeId: string;
        atividadeTitulo: string;
        concluiu: boolean;
        dorAntes: number | null;
        dorDepois: number | null;
        dificuldade: import("./entities/atividade-checkin.entity").DificuldadeExecucao | null;
        tempoMinutos: number | null;
        motivoNaoExecucao: string | null;
        feedbackLivre: string | null;
        createdAt: Date;
    }[]>;
    findUpdates(usuario: Usuario, since?: string, limit?: string): Promise<{
        checkinId: string;
        atividadeId: string;
        atividadeTitulo: string;
        pacienteId: string;
        pacienteNome: string;
        concluiu: boolean;
        dorAntes: number | null;
        dorDepois: number | null;
        dificuldade: import("./entities/atividade-checkin.entity").DificuldadeExecucao | null;
        tempoMinutos: number | null;
        motivoNaoExecucao: string | null;
        createdAt: Date;
    }[]>;
    createMeuCheckin(atividadeId: string, dto: CreateAtividadeCheckinDto, usuario: Usuario): Promise<import("./entities/atividade-checkin.entity").AtividadeCheckin>;
    findCheckinsByAtividade(atividadeId: string, usuario: Usuario): Promise<import("./entities/atividade-checkin.entity").AtividadeCheckin[]>;
}
