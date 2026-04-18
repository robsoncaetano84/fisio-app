# Etapa 19 - Checklist Pos Deploy

## 1) Backend

- Deploy da branch `etapa-19-melhoria-fluxo` no servico backend.
- Confirmar migration aplicada:
  - comando: `npm run migration:run` (em `apps/backend`)
  - esperado: sem erro.
- Validar endpoint resumo de metricas (autenticado):
  - `GET /api/metrics/clinical-flow/summary?windowDays=7`
  - esperado: payload com `opened`, `completed`, `abandoned`, `blocked`.

## 2) Frontend

- Deploy da branch `etapa-19-melhoria-fluxo` no frontend.
- Configurar variaveis:
  - `EXPO_PUBLIC_TERMS_URL`
  - `EXPO_PUBLIC_PRIVACY_URL`
  - `EXPO_PUBLIC_LEGAL_VERSION`

## 3) Validacao funcional

- Profissional:
  - abrir Home e confirmar painel de metricas clinicas com dados apos navegar/salvar etapas.
  - abrir Configuracoes e validar links de Termos/Privacidade.
- Paciente:
  - cadastro por convite exige consentimentos obrigatorios.
  - em Configuracoes, consentimentos opcionais editaveis e persistidos.

## 4) Cenarios de fallback

- Com backend indisponivel para metricas:
  - Home deve continuar funcionando.
  - resumo deve cair no fallback local sem quebrar fluxo.

