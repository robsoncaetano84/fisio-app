import {
  mapDorClassificationSuggestionResponse,
  mapEvolucaoSoapSuggestionResponse,
} from './charles-suggestion-response.mapper';

describe('charles suggestion response mapper', () => {
  const activeProtocol = {
    version: '1.0.0',
    name: 'Protocolo clinico base',
  };

  it('maps pain classification suggestion response', () => {
    const response = mapDorClassificationSuggestionResponse({
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

    expect(response).toMatchObject({
      orchestrator: 'CLINICAL_ORCHESTRATOR',
      mode: 'assistive-v1',
      requiresProfessionalApproval: true,
      patientId: 'pac-1',
      stage: 'EXAME_FISICO',
      suggestionType: 'DOR_CLASSIFICATION',
      confidence: 'ALTA',
      protocolVersion: '1.0.0',
      protocolName: 'Protocolo clinico base',
      dorPrincipal: 'NOCICEPTIVA',
      dorSubtipo: 'MECANICA',
    });
  });

  it('maps SOAP suggestion response', () => {
    const response = mapEvolucaoSoapSuggestionResponse({
      patientId: 'pac-1',
      activeProtocol: null,
      suggestion: {
        confidence: 'MODERADA',
        reason: 'Sugestao textual.',
        evidenceFields: ['areasAfetadas'],
        subjetivo: 'Paciente relata dor.',
        objetivo: 'Registrar ADM.',
        avaliacao: 'Quadro inicial.',
        plano: 'Manter conduta ativa.',
      },
    });

    expect(response).toMatchObject({
      orchestrator: 'CLINICAL_ORCHESTRATOR',
      mode: 'assistive-v1',
      requiresProfessionalApproval: true,
      patientId: 'pac-1',
      stage: 'EVOLUCAO',
      suggestionType: 'EVOLUCAO_SOAP',
      confidence: 'MODERADA',
      protocolVersion: null,
      protocolName: null,
      subjetivo: 'Paciente relata dor.',
      objetivo: 'Registrar ADM.',
      avaliacao: 'Quadro inicial.',
      plano: 'Manter conduta ativa.',
    });
  });
});
