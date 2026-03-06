import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { LaudosService } from './laudos.service';
import { CreateLaudoDto } from './dto/create-laudo.dto';
import { UpdateLaudoDto } from './dto/update-laudo.dto';
import { GenerateLaudoDto } from './dto/generate-laudo.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
export declare class LaudosController {
    private readonly laudosService;
    private readonly configService;
    constructor(laudosService: LaudosService, configService: ConfigService);
    private resolveUsuarioIdFromAccessToken;
    private resolveUsuarioIdFromRequest;
    create(createLaudoDto: CreateLaudoDto, usuario: Usuario): Promise<import("./entities/laudo.entity").Laudo>;
    findByPaciente(pacienteId: string, autoGenerate: string | undefined, usuario: Usuario): Promise<import("./entities/laudo.entity").Laudo | null>;
    generateByPaciente(generateLaudoDto: GenerateLaudoDto, usuario: Usuario): Promise<import("./entities/laudo.entity").Laudo>;
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
    findOne(id: string, usuario: Usuario): Promise<import("./entities/laudo.entity").Laudo>;
    pdfLaudo(id: string, req: Request, token: string | undefined, consultedRefs: string | undefined, res: Response): Promise<void>;
    findMyLatest(usuario: Usuario): Promise<import("./entities/laudo.entity").Laudo>;
    myPdfLaudo(req: Request, token: string | undefined, res: Response): Promise<void>;
    myPdfPlano(req: Request, token: string | undefined, res: Response): Promise<void>;
    pdfPlano(id: string, req: Request, token: string | undefined, consultedRefs: string | undefined, res: Response): Promise<void>;
    update(id: string, updateLaudoDto: UpdateLaudoDto, usuario: Usuario): Promise<import("./entities/laudo.entity").Laudo>;
    validar(id: string, usuario: Usuario): Promise<import("./entities/laudo.entity").Laudo>;
    remove(id: string, usuario: Usuario): Promise<void>;
}
