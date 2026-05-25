export type CommunityAiCapabilityKey =
  | 'discussion-summary'
  | 'reference-suggestions'
  | 'tag-suggestions'
  | 'moderation-triage'
  | 'spam-detection'
  | 'technical-rewrite';

export type CommunityAiCapabilityStatus =
  | 'planned'
  | 'contract-ready'
  | 'requires-backend';

export type CommunityAiCapability = {
  key: CommunityAiCapabilityKey;
  title: string;
  description: string;
  endpoint: string;
  status: CommunityAiCapabilityStatus;
  inputs: string[];
  outputs: string[];
  requiresProfessionalReview: boolean;
};

export type CommunityAiContract = {
  name: string;
  method: 'POST';
  path: string;
  requestFields: string[];
  responseFields: string[];
  auditEvents: string[];
};

export const communityAiGuardrails = [
  'Nao gerar diagnostico automatico sem revisao profissional.',
  'Nao substituir avaliacao presencial, julgamento clinico ou escopo profissional.',
  'Nao processar dados identificaveis de pacientes sem anonimizar.',
  'Sempre marcar sugestoes como apoio editorial ou tecnico, nao como decisao final.',
  'Registrar auditoria para sugestoes aceitas, editadas, rejeitadas ou denunciadas.',
  'Priorizar referencias, clareza tecnica e seguranca etica, nao engajamento.',
];

export const communityAiCapabilities: CommunityAiCapability[] = [
  {
    key: 'discussion-summary',
    title: 'Resumo tecnico de discussoes',
    description:
      'Gerar um resumo estruturado com pergunta clinica, achados, respostas uteis, limites e proximos pontos de estudo.',
    endpoint: '/community/ai/discussions/:discussionId/summary',
    status: 'contract-ready',
    inputs: ['discussionId', 'selectedReplyIds?', 'locale'],
    outputs: ['summaryMarkdown', 'keyPoints', 'limitations', 'reviewRequired'],
    requiresProfessionalReview: true,
  },
  {
    key: 'reference-suggestions',
    title: 'Sugestao de referencias',
    description:
      'Sugerir artigos, guidelines ou palavras-chave para pesquisa a partir de uma discussao clinica anonimizada.',
    endpoint: '/community/ai/discussions/:discussionId/references',
    status: 'requires-backend',
    inputs: ['discussionId', 'categorySlug', 'tags', 'clinicalQuestion'],
    outputs: ['suggestedQueries', 'references', 'confidenceNotes'],
    requiresProfessionalReview: true,
  },
  {
    key: 'tag-suggestions',
    title: 'Sugestao de tags e categoria',
    description:
      'Apoiar a organizacao do conteudo sugerindo tags tecnicas, categoria e nivel de sensibilidade etica.',
    endpoint: '/community/ai/content/classification',
    status: 'contract-ready',
    inputs: ['title', 'contentMarkdown', 'resourceKind?'],
    outputs: ['categorySlug', 'tags', 'privacyRiskLevel', 'reasoning'],
    requiresProfessionalReview: true,
  },
  {
    key: 'moderation-triage',
    title: 'Triagem de moderacao',
    description:
      'Priorizar denuncias com possivel dado sensivel, spam, conduta inadequada ou risco de orientacao insegura.',
    endpoint: '/community/ai/moderation/triage',
    status: 'requires-backend',
    inputs: ['reportId', 'targetType', 'targetText', 'reason'],
    outputs: ['riskLevel', 'suggestedAction', 'policyMatches'],
    requiresProfessionalReview: true,
  },
  {
    key: 'spam-detection',
    title: 'Deteccao anti-spam',
    description:
      'Classificar conteudo repetitivo, promocional, ofensivo ou fora de escopo antes da publicacao.',
    endpoint: '/community/ai/content/spam-check',
    status: 'planned',
    inputs: ['authorId', 'contentMarkdown', 'links', 'attachmentsMetadata'],
    outputs: ['spamScore', 'detectedPatterns', 'recommendedThrottle'],
    requiresProfessionalReview: false,
  },
  {
    key: 'technical-rewrite',
    title: 'Apoio de redacao tecnica',
    description:
      'Sugerir organizacao e clareza para perguntas, respostas e referencias mantendo o texto editavel.',
    endpoint: '/community/ai/editor/rewrite',
    status: 'contract-ready',
    inputs: ['contentMarkdown', 'intent', 'professionalRole'],
    outputs: ['suggestedMarkdown', 'changes', 'safetyNotes'],
    requiresProfessionalReview: true,
  },
];

export const communityAiContracts: CommunityAiContract[] = [
  {
    name: 'Resumo de discussao',
    method: 'POST',
    path: '/api/community/ai/discussions/:discussionId/summary',
    requestFields: ['discussionId', 'selectedReplyIds?', 'locale'],
    responseFields: ['summaryMarkdown', 'keyPoints', 'limitations', 'reviewRequired'],
    auditEvents: ['AI_SUMMARY_REQUESTED', 'AI_SUMMARY_ACCEPTED', 'AI_SUMMARY_EDITED'],
  },
  {
    name: 'Classificacao de conteudo',
    method: 'POST',
    path: '/api/community/ai/content/classification',
    requestFields: ['title', 'contentMarkdown', 'resourceKind?', 'authorRole'],
    responseFields: ['categorySlug', 'tags', 'privacyRiskLevel', 'reasoning'],
    auditEvents: ['AI_CLASSIFICATION_REQUESTED', 'AI_CLASSIFICATION_APPLIED'],
  },
  {
    name: 'Triagem de moderacao',
    method: 'POST',
    path: '/api/community/ai/moderation/triage',
    requestFields: ['reportId', 'targetType', 'targetText', 'reason'],
    responseFields: ['riskLevel', 'suggestedAction', 'policyMatches'],
    auditEvents: ['AI_MODERATION_TRIAGE_REQUESTED', 'AI_MODERATION_REVIEWED'],
  },
];

export function getCommunityAiStatusLabel(
  status: CommunityAiCapabilityStatus,
): string {
  if (status === 'contract-ready') return 'Contrato preparado';
  if (status === 'requires-backend') return 'Aguardando backend';
  return 'Planejado';
}
