import {
  buildDorClassificationSuggestionAuditPayload,
  buildEvolucaoSoapSuggestionAuditPayload,
  buildNextActionAuditPayload,
} from './charles-audit.util';
import { buildCharlesNextActionResponse } from './charles-next-action.util';

describe('charles audit util', () => {
  const actor = { id: 'user-1' } as any;
  const activeProtocol = {
    version: '1.0.0',
    name: 'Protocolo clinico base',
  };

  it('builds next-action audit payload', () => {
    const response = buildCharlesNextActionResponse({
      paciente: {
        id: 'pac-1',
        nomeCompleto: 'Paciente Teste',
      },
      activeProtocol,
    });

    const payload = buildNextActionAuditPayload({
      actor,
      response,
    });

    expect(payload).toMatchObject({
      actor,
      actionType: 'READ',
      action: 'orchestrator.next_action.read',
      resourceType: 'CLINICAL_ORCHESTRATOR',
      resourceId: 'pac-1',
      patientId: 'pac-1',
      metadata: {
        nextStage: 'ANAMNESE',
        mode: 'deterministic-v1',
        protocolVersion: '1.0.0',
        protocolName: 'Protocolo clinico base',
      },
    });
  });

  it('builds pain classification suggestion audit payload', () => {
    const payload = buildDorClassificationSuggestionAuditPayload({
      actor,
      patientId: 'pac-1',
      activeProtocol,
      suggestion: {
        principal: 'NOCICEPTIVA',
        subtipo: 'MECANICA',
        confidence: 'ALTA',
        reason: 'Classificacao direta.',
        evidenceFields: ['tipoDor'],
      },
    });

    expect(payload).toMatchObject({
      action: 'orchestrator.ai_suggestion.read',
      resourceType: 'AI_SUGGESTION',
      resourceId: 'EXAME_FISICO:DOR_CLASSIFICATION',
      patientId: 'pac-1',
      metadata: {
        stage: 'EXAME_FISICO',
        suggestionType: 'DOR_CLASSIFICATION',
        confidence: 'ALTA',
        evidenceFields: ['tipoDor'],
        protocolVersion: '1.0.0',
      },
    });
  });

  it('builds SOAP suggestion audit payload', () => {
    const payload = buildEvolucaoSoapSuggestionAuditPayload({
      actor,
      patientId: 'pac-1',
      activeProtocol: null,
      suggestion: {
        confidence: 'BAIXA',
        reason: 'Dados insuficientes.',
        evidenceFields: [],
        subjetivo: null,
        objetivo: null,
        avaliacao: null,
        plano: null,
      },
    });

    expect(payload).toMatchObject({
      action: 'orchestrator.ai_suggestion.read',
      resourceType: 'AI_SUGGESTION',
      resourceId: 'EVOLUCAO:SOAP',
      patientId: 'pac-1',
      metadata: {
        stage: 'EVOLUCAO',
        suggestionType: 'EVOLUCAO_SOAP',
        confidence: 'BAIXA',
        evidenceFields: [],
        protocolVersion: null,
        protocolName: null,
      },
    });
  });
});
