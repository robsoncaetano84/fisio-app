import { CharlesDorClassificationSuggestion } from './charles-dor-classification.util';
import { CharlesSoapSuggestionDraft } from './charles-soap-suggestion.util';

type ActiveProtocolSummary = {
  version: string;
  name: string;
} | null;

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
  dorPrincipal:
    | 'NOCICEPTIVA'
    | 'NEUROPATICA'
    | 'NOCIPLASTICA'
    | 'INFLAMATORIA'
    | 'VISCERAL'
    | null;
  dorSubtipo:
    | 'MECANICA'
    | 'DISCAL'
    | 'NEURAL'
    | 'REFERIDA'
    | 'INFLAMATORIA'
    | 'MIOFASCIAL'
    | 'FACETARIA'
    | 'NAO_MECANICA'
    | null;
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

export function mapDorClassificationSuggestionResponse(args: {
  patientId: string;
  suggestion: CharlesDorClassificationSuggestion;
  activeProtocol: ActiveProtocolSummary;
}): CharlesExameFisicoDorSuggestionResponse {
  const { patientId, suggestion, activeProtocol } = args;

  return {
    orchestrator: 'CLINICAL_ORCHESTRATOR',
    mode: 'assistive-v1',
    requiresProfessionalApproval: true,
    patientId,
    stage: 'EXAME_FISICO',
    suggestionType: 'DOR_CLASSIFICATION',
    confidence: suggestion.confidence,
    reason: suggestion.reason,
    evidenceFields: suggestion.evidenceFields,
    protocolVersion: activeProtocol?.version || null,
    protocolName: activeProtocol?.name || null,
    dorPrincipal: suggestion.principal,
    dorSubtipo: suggestion.subtipo,
  };
}

export function mapEvolucaoSoapSuggestionResponse(args: {
  patientId: string;
  suggestion: CharlesSoapSuggestionDraft;
  activeProtocol: ActiveProtocolSummary;
}): CharlesEvolucaoSoapSuggestionResponse {
  const { patientId, suggestion, activeProtocol } = args;

  return {
    orchestrator: 'CLINICAL_ORCHESTRATOR',
    mode: 'assistive-v1',
    requiresProfessionalApproval: true,
    patientId,
    stage: 'EVOLUCAO',
    suggestionType: 'EVOLUCAO_SOAP',
    confidence: suggestion.confidence,
    reason: suggestion.reason,
    evidenceFields: suggestion.evidenceFields,
    protocolVersion: activeProtocol?.version || null,
    protocolName: activeProtocol?.name || null,
    subjetivo: suggestion.subjetivo,
    objetivo: suggestion.objetivo,
    avaliacao: suggestion.avaliacao,
    plano: suggestion.plano,
  };
}
