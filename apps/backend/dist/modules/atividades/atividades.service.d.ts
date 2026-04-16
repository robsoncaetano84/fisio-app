import { Repository } from 'typeorm';
import { Atividade } from './entities/atividade.entity';
import { AtividadeCheckin, DificuldadeExecucao, MelhoriaSessao } from './entities/atividade-checkin.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { CreateAtividadeCheckinDto } from './dto/create-atividade-checkin.dto';
import { DuplicateAtividadeDto } from './dto/duplicate-atividade.dto';
import { DuplicateAtividadesBatchDto } from './dto/duplicate-atividades-batch.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { GenerateAtividadeAiDto } from './dto/generate-atividade-ai.dto';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
export declare class AtividadesService {
    private readonly atividadeRepository;
    private readonly checkinRepository;
    private readonly pacienteRepository;
    private readonly anamneseRepository;
    private readonly notificacoesService;
    constructor(atividadeRepository: Repository<Atividade>, checkinRepository: Repository<AtividadeCheckin>, pacienteRepository: Repository<Paciente>, anamneseRepository: Repository<Anamnese>, notificacoesService: NotificacoesService);
    create(dto: CreateAtividadeDto, usuarioId: string): Promise<Atividade>;
    findByPaciente(pacienteId: string, usuarioId: string): Promise<Atividade[]>;
    inativar(atividadeId: string, usuarioId: string): Promise<{
        success: true;
    }>;
    duplicar(atividadeId: string, usuarioId: string, dto?: DuplicateAtividadeDto): Promise<Atividade>;
    duplicarLote(usuarioId: string, dto: DuplicateAtividadesBatchDto): Promise<{
        total: number;
    }>;
    update(atividadeId: string, dto: UpdateAtividadeDto, usuarioId: string): Promise<Atividade>;
    findMinhasAtividades(usuario: Usuario): Promise<Array<Atividade & {
        ultimoCheckinEm: Date | null;
        ultimoCheckinConcluiu: boolean | null;
    }>>;
    createMeuCheckin(atividadeId: string, dto: CreateAtividadeCheckinDto, usuario: Usuario): Promise<AtividadeCheckin>;
    findCheckinsByAtividade(atividadeId: string, usuarioId: string): Promise<AtividadeCheckin[]>;
    findCheckinsByPaciente(pacienteId: string, usuarioId: string): Promise<Array<{
        id: string;
        atividadeId: string;
        atividadeTitulo: string;
        concluiu: boolean;
        dorAntes: number | null;
        dorDepois: number | null;
        dificuldade: DificuldadeExecucao | null;
        tempoMinutos: number | null;
        motivoNaoExecucao: string | null;
        feedbackLivre: string | null;
        createdAt: Date;
    }>>;
    findUpdatesByProfissional(usuarioId: string, options?: {
        since?: string;
        limit?: number;
    }): Promise<Array<{
        checkinId: string;
        atividadeId: string;
        atividadeTitulo: string;
        pacienteId: string;
        pacienteNome: string;
        concluiu: boolean;
        dorAntes: number | null;
        dorDepois: number | null;
        dificuldade: DificuldadeExecucao | null;
        tempoMinutos: number | null;
        motivoNaoExecucao: string | null;
        melhoriaSessao: MelhoriaSessao | null;
        melhoriaDescricao: string | null;
        createdAt: Date;
    }>>;
    generateAiSuggestion(dto: GenerateAtividadeAiDto, usuarioId: string): Promise<{
        titulo: string;
        descricao: string;
        referencias?: string[];
        source: 'ai' | 'rules';
        model?: string;
    }>;
    private getAgeInYears;
    private extractJsonObject;
    private sanitizeText;
    private buildRuleSuggestion;
    private generateWithOpenAI;
    private getDefaultBibliographicReferences;
    private normalizeReferences;
    private appendReferencesToDescricao;
}
