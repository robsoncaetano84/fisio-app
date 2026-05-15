import { ClinicalGovernanceService } from '../clinical-governance/clinical-governance.service';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CharlesDorClassificationSuggestion } from './charles-dor-classification.util';
import { CharlesNextActionResponse } from './charles-next-action.util';
import { CharlesSoapSuggestionDraft } from './charles-soap-suggestion.util';

type ActiveProtocolSummary = {
  version: string;
  name: string;
} | null;

export type CharlesAuditPayload = Parameters<
  ClinicalGovernanceService['writeAudit']
>[0];

export function buildNextActionAuditPayload(args: {
  actor: Usuario;
  response: CharlesNextActionResponse;
}): CharlesAuditPayload {
  const { actor, response } = args;

  return {
    actor,
    actionType: 'READ',
    action: 'orchestrator.next_action.read',
    resourceType: 'CLINICAL_ORCHESTRATOR',
    resourceId: response.paciente.id,
    patientId: response.paciente.id,
    metadata: {
      nextStage: response.nextAction.stage,
      mode: response.mode,
      protocolVersion: response.protocolVersion,
      protocolName: response.protocolName,
    },
  };
}

export function buildDorClassificationSuggestionAuditPayload(args: {
  actor: Usuario;
  patientId: string;
  suggestion: CharlesDorClassificationSuggestion;
  activeProtocol: ActiveProtocolSummary;
}): CharlesAuditPayload {
  return buildSuggestionAuditPayload({
    actor: args.actor,
    patientId: args.patientId,
    stage: 'EXAME_FISICO',
    suggestionType: 'DOR_CLASSIFICATION',
    resourceId: 'EXAME_FISICO:DOR_CLASSIFICATION',
    confidence: args.suggestion.confidence,
    evidenceFields: args.suggestion.evidenceFields,
    activeProtocol: args.activeProtocol,
  });
}

export function buildEvolucaoSoapSuggestionAuditPayload(args: {
  actor: Usuario;
  patientId: string;
  suggestion: CharlesSoapSuggestionDraft;
  activeProtocol: ActiveProtocolSummary;
}): CharlesAuditPayload {
  return buildSuggestionAuditPayload({
    actor: args.actor,
    patientId: args.patientId,
    stage: 'EVOLUCAO',
    suggestionType: 'EVOLUCAO_SOAP',
    resourceId: 'EVOLUCAO:SOAP',
    confidence: args.suggestion.confidence,
    evidenceFields: args.suggestion.evidenceFields,
    activeProtocol: args.activeProtocol,
  });
}

function buildSuggestionAuditPayload(args: {
  actor: Usuario;
  patientId: string;
  stage: 'EXAME_FISICO' | 'EVOLUCAO';
  suggestionType: 'DOR_CLASSIFICATION' | 'EVOLUCAO_SOAP';
  resourceId: string;
  confidence: 'BAIXA' | 'MODERADA' | 'ALTA';
  evidenceFields: string[];
  activeProtocol: ActiveProtocolSummary;
}): CharlesAuditPayload {
  return {
    actor: args.actor,
    actionType: 'READ',
    action: 'orchestrator.ai_suggestion.read',
    resourceType: 'AI_SUGGESTION',
    resourceId: args.resourceId,
    patientId: args.patientId,
    metadata: {
      stage: args.stage,
      suggestionType: args.suggestionType,
      confidence: args.confidence,
      evidenceFields: args.evidenceFields,
      protocolVersion: args.activeProtocol?.version || null,
      protocolName: args.activeProtocol?.name || null,
    },
  };
}
