# Pré-Produção: LGPD, IA Clínica e UX

## LGPD e Jurídico
- Revisar Termos de Uso com advogado antes do release público.
- Revisar Política de Privacidade com advogado antes do release público.
- Confirmar versões configuradas no backend:
  - `CONSENT_TERMS_VERSION`
  - `CONSENT_PRIVACY_VERSION`
  - `CONSENT_RESEARCH_VERSION`
  - `CONSENT_AI_VERSION`
  - `CONSENT_PROFESSIONAL_LGPD_VERSION`
- Validar que novos usuários gravam snapshot de versão no `usuarios`.
- Validar que mudanças de consentimento gravam histórico em `consent_purpose_logs`.
- Deixar claro nos textos legais:
  - dados clínicos são usados para assistência fisioterapêutica;
  - IA gera sugestão, não diagnóstico final;
  - exames médicos enviados são interpretados como apoio e exigem correlação clínica;
  - microfone/transcrição depende de permissão do usuário;
  - biometria/facial é local no aparelho e não envia dado biométrico ao backend.

## IA Clínica
- Toda sugestão deve aparecer como rascunho ou recomendação para revisão.
- Laudo final exige `VALIDADO_PROFISSIONAL`.
- Exame médico anexado não pode substituir anamnese, exame físico e julgamento profissional.
- Logs operacionais devem conter:
  - operação;
  - modelo;
  - versão do prompt;
  - latência;
  - resumo sem dados clínicos sensíveis;
  - motivo do fallback quando IA estiver indisponível.
- Testar fallback com `OPENAI_API_KEY` vazio.
- Testar fallback com timeout reduzido.
- Testar red flags para garantir que o plano não progride carga antes de reavaliação.

## Observabilidade
- Configurar `SENTRY_REQUIRED=true` em HML/produção.
- Configurar `SENTRY_DSN` real no Render.
- Configurar `EXPO_PUBLIC_SENTRY_DSN` real no app mobile/web.
- Confirmar eventos em logs:
  - `auth.login.failed`;
  - `auth.refresh.failed`;
  - `ai.request.failed`;
  - `laudo.generation.failed`;
  - `exam.upload.failed`.
- Confirmar sucesso em logs:
  - `ai.request.completed`;
  - `laudo.generation.succeeded`;
  - `exam.upload.succeeded`;
  - `laudo.professional_validation.succeeded`.
- Alertar para aumento de 5xx, falhas de login e falhas de geração de laudo.

## UX Final
- Testar preenchimento por voz em Android real, com permissão negada e concedida.
- Confirmar que cada botão de microfone preenche o campo correto.
- Reduzir obrigatoriedade apenas ao que é clinicamente essencial.
- Confirmar textos de navegação:
  - "Anterior" para etapa anterior;
  - "Próximo" para etapa seguinte;
  - "Voltar ao paciente" quando sai do fluxo;
  - "Salvar" quando grava dados.
- Testar web em desktop, notebook e largura mobile.
- Testar mobile em tela pequena e tela grande.
- Confirmar que botões não quebram linha de forma ruim e que textos não sobrepõem cards.
