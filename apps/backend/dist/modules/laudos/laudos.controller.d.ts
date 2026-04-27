import type { Response } from 'express';
import { LaudosService } from './laudos.service';
import { CreateLaudoDto } from './dto/create-laudo.dto';
import { UpdateLaudoDto } from './dto/update-laudo.dto';
import { CreateExameFisicoDto } from './dto/create-exame-fisico.dto';
import { GenerateLaudoDto } from './dto/generate-laudo.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
export declare class LaudosController {
    private readonly laudosService;
    constructor(laudosService: LaudosService);
    create(createLaudoDto: CreateLaudoDto, usuario: Usuario): Promise<import("./entities/laudo.entity").Laudo>;
    findByPaciente(pacienteId: string, autoGenerate: string | undefined, usuario: Usuario): Promise<import("./entities/laudo.entity").Laudo | null>;
    generateByPaciente(generateLaudoDto: GenerateLaudoDto, usuario: Usuario): Promise<import("./entities/laudo.entity").Laudo>;
    suggestByPaciente(generateLaudoDto: GenerateLaudoDto, usuario: Usuario): Promise<{
        source: "ai" | "rules";
        examesConsiderados: number;
        examesComLeituraIa: number;
        sugestaoGeradaEm: string;
        confidence: "BAIXA" | "MODERADA" | "ALTA";
        reason: string;
        evidenceFields: string[];
    } & Partial<CreateLaudoDto>>;
    getSuggestedReferences(pacienteId: string, usuario: Usuario): Promise<{
        profile: "GERAL" | "LOMBAR" | "CERVICAL" | "JOELHO";
        disclaimer: string;
        laudoReferences: {
            id: string;
            title: string;
            category: "LIVRO" | "ARTIGO" | "GUIDELINE";
            source: string;
            year?: number;
            authors?: string;
            url: string;
            rationale: string;
        }[];
        planoReferences: {
            id: string;
            title: string;
            category: "LIVRO" | "ARTIGO" | "GUIDELINE";
            source: string;
            year?: number;
            authors?: string;
            url: string;
            rationale: string;
        }[];
    }>;
    findExameFisicoByPaciente(pacienteId: string, usuario: Usuario): Promise<import("./entities/laudo-exame-fisico.entity").LaudoExameFisico | null>;
    createExameFisico(createExameFisicoDto: CreateExameFisicoDto, usuario: Usuario): Promise<import("./entities/laudo-exame-fisico.entity").LaudoExameFisico>;
    myPdfLaudo(usuario: Usuario, res: Response): Promise<void>;
    myPdfPlano(usuario: Usuario, res: Response): Promise<void>;
    findMyLatest(usuario: Usuario): Promise<import("./entities/laudo.entity").Laudo>;
    findOne(id: string, usuario: Usuario): Promise<import("./entities/laudo.entity").Laudo>;
    findExameFisicoHistory(id: string, limitRaw: string | undefined, usuario: Usuario): Promise<import("./entities/laudo-exame-historico.entity").LaudoExameHistorico[]>;
    pdfLaudo(id: string, consultedRefs: string | undefined, usuario: Usuario, res: Response): Promise<void>;
    pdfPlano(id: string, consultedRefs: string | undefined, usuario: Usuario, res: Response): Promise<void>;
    update(id: string, updateLaudoDto: UpdateLaudoDto, usuario: Usuario): Promise<import("./entities/laudo.entity").Laudo>;
    validar(id: string, usuario: Usuario): Promise<import("./entities/laudo.entity").Laudo>;
    remove(id: string, usuario: Usuario): Promise<void>;
}
