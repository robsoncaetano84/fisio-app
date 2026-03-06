import { Repository } from 'typeorm';
import { Laudo } from './entities/laudo.entity';
import { CreateLaudoDto } from './dto/create-laudo.dto';
import { UpdateLaudoDto } from './dto/update-laudo.dto';
import { PacientesService } from '../pacientes/pacientes.service';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { LaudoAiGeneration } from './entities/laudo-ai-generation.entity';
type LaudoReferenceCategory = 'LIVRO' | 'ARTIGO' | 'GUIDELINE';
type LaudoReferenceItem = {
    id: string;
    title: string;
    category: LaudoReferenceCategory;
    source: string;
    year?: number;
    authors?: string;
    url: string;
    rationale: string;
};
type LaudoReferenceProfile = 'GERAL' | 'LOMBAR' | 'CERVICAL' | 'JOELHO';
type LaudoReferenceSuggestionResponse = {
    profile: LaudoReferenceProfile;
    disclaimer: string;
    laudoReferences: LaudoReferenceItem[];
    planoReferences: LaudoReferenceItem[];
};
export declare class LaudosService {
    private readonly laudoRepository;
    private readonly anamneseRepository;
    private readonly evolucaoRepository;
    private readonly laudoAiGenerationRepository;
    private readonly pacientesService;
    constructor(laudoRepository: Repository<Laudo>, anamneseRepository: Repository<Anamnese>, evolucaoRepository: Repository<Evolucao>, laudoAiGenerationRepository: Repository<LaudoAiGeneration>, pacientesService: PacientesService);
    getSuggestedReferences(pacienteId: string, usuarioId: string): Promise<LaudoReferenceSuggestionResponse>;
    create(createLaudoDto: CreateLaudoDto, usuarioId: string): Promise<Laudo>;
    findByPaciente(pacienteId: string, usuarioId: string, autoGenerate?: boolean): Promise<Laudo | null>;
    findOne(id: string, usuarioId: string): Promise<Laudo>;
    findLatestByPacienteUsuario(usuarioId: string): Promise<Laudo>;
    update(id: string, updateLaudoDto: UpdateLaudoDto, usuarioId: string): Promise<Laudo>;
    remove(id: string, usuarioId: string): Promise<void>;
    validarLaudo(id: string, usuarioId: string): Promise<Laudo>;
    buildPdfBuffer(id: string, usuarioId: string, tipo: 'laudo' | 'plano', options?: {
        consultedReferenceIds?: string[];
    }): Promise<Buffer>;
    private addReferenceSection;
    private addScientificValidationSummary;
    buildPdfBufferByPacienteUsuario(usuarioId: string, tipo: 'laudo' | 'plano'): Promise<Buffer>;
    generateAndSaveByPaciente(pacienteId: string, usuarioId: string): Promise<Laudo>;
    private calculateAge;
    private extractJsonObject;
    private generateSuggestionWithAI;
    private getUtcDayString;
    private acquireDailyAiGenerationSlot;
    private addSection;
    private inferReferenceProfile;
    private getReferenceCatalog;
}
export {};
