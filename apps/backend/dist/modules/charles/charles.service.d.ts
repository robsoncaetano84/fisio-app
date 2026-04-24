import { Repository } from 'typeorm';
import { PacientesService } from '../pacientes/pacientes.service';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ClinicalGovernanceService } from '../clinical-governance/clinical-governance.service';
export type CharlesClinicalStage = 'ANAMNESE' | 'EXAME_FISICO' | 'EVOLUCAO' | 'LAUDO' | 'PLANO' | 'MONITORAMENTO';
export type CharlesStageStatus = 'PENDING' | 'COMPLETED' | 'BLOCKED';
export interface CharlesStageItem {
    stage: CharlesClinicalStage;
    status: CharlesStageStatus;
    reason: string;
}
export interface CharlesNextAction {
    stage: CharlesClinicalStage;
    reason: string;
    guidance: string;
}
export interface CharlesNextActionResponse {
    orchestrator: 'CLINICAL_ORCHESTRATOR';
    mode: 'deterministic-v1';
    requiresProfessionalApproval: true;
    blocked: boolean;
    paciente: {
        id: string;
        nomeCompleto: string;
    };
    context: {
        regioesPrioritarias: string[];
        regioesRelacionadas: string[];
        cadeiaProvavel: string | null;
    };
    timeline: {
        anamneseEm: Date | null;
        exameFisicoEm: Date | null;
        evolucaoEm: Date | null;
        laudoEm: Date | null;
    };
    blockers: Array<{
        code: string;
        severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
        message: string;
    }>;
    alerts: Array<{
        code: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
        message: string;
    }>;
    stages: CharlesStageItem[];
    nextAction: CharlesNextAction;
}
export interface CharlesExameFisicoDorSuggestionResponse {
    orchestrator: 'CLINICAL_ORCHESTRATOR';
    mode: 'assistive-v1';
    requiresProfessionalApproval: true;
    patientId: string;
    stage: 'EXAME_FISICO';
    suggestionType: 'DOR_CLASSIFICATION';
    confidence: 'BAIXA' | 'MODERADA' | 'ALTA';
    reason: string;
    evidenceFields: string[];
    protocolVersion: string | null;
    protocolName: string | null;
    dorPrincipal: 'NOCICEPTIVA' | 'NEUROPATICA' | 'NOCIPLASTICA' | 'INFLAMATORIA' | 'VISCERAL' | null;
    dorSubtipo: 'MECANICA' | 'DISCAL' | 'NEURAL' | 'REFERIDA' | 'INFLAMATORIA' | 'MIOFASCIAL' | 'FACETARIA' | 'NAO_MECANICA' | null;
}
export interface CharlesEvolucaoSoapSuggestionResponse {
    orchestrator: 'CLINICAL_ORCHESTRATOR';
    mode: 'assistive-v1';
    requiresProfessionalApproval: true;
    patientId: string;
    stage: 'EVOLUCAO';
    suggestionType: 'EVOLUCAO_SOAP';
    confidence: 'BAIXA' | 'MODERADA' | 'ALTA';
    reason: string;
    evidenceFields: string[];
    protocolVersion: string | null;
    protocolName: string | null;
    subjetivo: string | null;
    objetivo: string | null;
    avaliacao: string | null;
    plano: string | null;
}
export declare class CharlesService {
    private readonly pacientesService;
    private readonly governanceService;
    private readonly anamneseRepository;
    private readonly evolucaoRepository;
    private readonly laudoRepository;
    constructor(pacientesService: PacientesService, governanceService: ClinicalGovernanceService, anamneseRepository: Repository<Anamnese>, evolucaoRepository: Repository<Evolucao>, laudoRepository: Repository<Laudo>);
    getNextAction(pacienteId: string, usuario: Usuario): Promise<CharlesNextActionResponse>;
    getExameFisicoDorSuggestion(pacienteId: string, usuario: Usuario): Promise<CharlesExameFisicoDorSuggestionResponse>;
    getEvolucaoSoapSuggestion(pacienteId: string, usuario: Usuario): Promise<CharlesEvolucaoSoapSuggestionResponse>;
    private getActiveProtocolSafe;
    private writeAuditSafe;
    private hasStructuredExame;
    private resolveNextAction;
    private buildClinicalContext;
    private normalizeClinicalRegion;
    private inferDorClassificationFromAnamnese;
    private inferEvolucaoSoapSuggestion;
}
