# Plano de Implementação - Clinical Orchestrator

## Objetivo
Implementar arquitetura híbrida (motor determinístico + IA assistiva explicável) para fluxo clínico completo com governança.

## Estratégia de Branches
1. `epic/clinical-orchestrator`
2. `feat/protocol-versioning`
3. `feat/consent-and-audit-lgpd`
4. `feat/orchestrator-deterministic-engine`
5. `feat/ai-assist-explanations`
6. `feat/ui-suggestion-approval-flow`
7. `feat/clinical-metrics-dashboard`
8. `feat/feature-flags-pilot-rollout`
9. `hardening/security-rbac-mask`
10. `chore/tests-and-release-gates`

## Sprint 1 - Protocolo e Governança Base
Branches:
- `feat/protocol-versioning`
- `feat/consent-and-audit-lgpd`

Critérios de aceite:
1. Protocolo clínico com versão ativa e histórico.
2. Consentimento por finalidade salvo e consultável.
3. Auditoria de leitura/edição/aprovação com usuário e timestamp.
4. Migrações sem perda de dados.

## Sprint 2 - Motor Determinístico
Branch:
- `feat/orchestrator-deterministic-engine`

Critérios de aceite:
1. Endpoint retorna próxima ação, bloqueios e alertas.
2. Red flag crítica bloqueia continuidade.
3. Contexto por região/cadeia aplicado em exame/evolução.
4. Testes unitários das regras críticas.

## Sprint 3 - IA Assistiva Explicável
Branch:
- `feat/ai-assist-explanations`

Critérios de aceite:
1. Sugestão retorna `confidence`, `reason` e `evidenceFields`.
2. Sem dados suficientes, não há autopreenchimento forçado.
3. Log da sugestão com versão de protocolo.
4. Falha/timeout da IA não interrompe fluxo clínico.

## Sprint 4 - UX de Aprovação Clínica
Branch:
- `feat/ui-suggestion-approval-flow`

Critérios de aceite:
1. UI diferencia "Sugerido por IA" e "Confirmado por profissional".
2. "Aplicar sugestão" opcional e auditável.
3. Campos críticos exigem confirmação humana para persistir.
4. Avisos de baixa confiança visíveis.

## Sprint 5 - Métricas Operacionais
Branch:
- `feat/clinical-metrics-dashboard`

Critérios de aceite:
1. Métricas de tempo por etapa, abandono, bloqueios e conclusão.
2. Dashboard resumido por janela temporal.
3. Filtros por profissional/paciente/status funcionais.
4. Performance dentro do SLA definido.

## Sprint 6 - Piloto e Rollout Controlado
Branches:
- `feat/feature-flags-pilot-rollout`
- `hardening/security-rbac-mask`
- `chore/tests-and-release-gates`

Critérios de aceite:
1. Feature flags por clínica/usuário.
2. RBAC e mascaramento de dados sensíveis validados.
3. Checklist go/no-go aprovado.
4. Plano de rollback testado.

### Status atual (2026-04-23)
- [x] Feature flags por usuário com endpoint autenticado (`/auth/feature-flags`)
- [x] Flags retornadas em `/auth/login` e `/auth/me`
- [x] App mobile aplica flags em runtime (login + restore session)
- [x] Runbook de rollout por usuário (`docs/feature-flags-rollout.md`)
- [x] Gate automático de release (`scripts/release-gates.ps1`) com relatório em `logs/`
- [x] CI com job dedicado de release gates (`.github/workflows/ci.yml`)
- [x] CI publica evidências do release (artefatos `logs/*.md`)
- [x] Testes de RBAC CRM admin (`modules/crm/crm.service.spec.ts`)
- [x] Testes de acesso sensível CRM (`modules/crm/crm.controller.spec.ts`)
- [x] Drill de rollback simulado (`scripts/rollback-drill.ps1`) com relatório em `logs/`
- [x] Script de monitoramento 5xx para endpoints clínicos (`scripts/monitor-clinical-5xx.ps1`)
- [x] `release-gates` suporta monitoramento autenticado por env (`MONITOR_*`)
- [x] Testes de governança clínica Sprint 1 (`modules/clinical-governance/clinical-governance.service.spec.ts`)
- [x] Testes de RBAC/metadata do controller de governança (`modules/clinical-governance/clinical-governance.controller.spec.ts`)
- [x] Leitura de trilha de auditoria também auditável (`audit.logs.read`)
- [x] `release-gates` exige os testes de governança (service + controller)
- [x] Charles retorna contexto de regiões relacionadas por cadeia (`regioesRelacionadas`) para orientar Exame/Evolução
- [x] Charles marca etapas como `BLOCKED` em red flag crítica e a UI usa esse status no fluxo clínico
- [x] Endpoint assistivo de sugestão explicável para Exame Físico (`DOR_CLASSIFICATION`) com auditoria de leitura no backend
- [x] Fluxo de Laudo/Plano passa a consumir `confidence`, `reason` e `evidenceFields` retornados pelo backend para log explicável
- [x] Endpoint assistivo de sugestão explicável para Evolução (`EVOLUCAO_SOAP`) com auditoria de leitura no backend e aplicação opcional no app

## Diretrizes de execução
1. Branches pequenas e PRs incrementais.
2. Sem decisão clínica automática final sem aprovação profissional.
3. Explicabilidade e auditoria em todas as sugestões IA.
4. Uso de feature flags para rollout progressivo.
