# Teste de carga em staging

## Objetivo
Validar se o ambiente de HML/staging suporta o fluxo clinico comum antes de promover para producao.

Meta minima:
- 300 usuarios virtuais
- 30 a 60 requisicoes por segundo no fluxo comum
- erro abaixo de 1%
- p95 de leitura abaixo de 800ms
- p95 de escrita abaixo de 1.5s
- IA, PDF e upload em cenario separado com timeout controlado

## Pre-requisitos
- Rodar apenas em HML/staging, com banco e storage descartaveis ou com backup.
- Render/Supabase em plano compativel com HML sem cold start.
- Migrations aplicadas.
- `TRUST_PROXY=true` no backend, se o teste usar IPs virtuais via `X-Forwarded-For`.
- Conta master/admin dedicada para carga.
- Nao usar credenciais pessoais.

O runner cria dados sinteticos: pacientes, anamneses, evolucoes, atividades, convites, usuarios paciente e laudos publicados. Esses dados ficam com prefixo `loadtest` e `LOAD_TEST_RUN_ID`.

## Dry-run local
Valida o plano sem enviar requisicoes:

```powershell
cd apps/backend
npm run load:staging -- --dry-run
```

## Execucao HML completa

```powershell
cd apps/backend
$env:LOAD_TEST_BASE_URL = "https://api-hml.seudominio.com/api"
$env:LOAD_TEST_ADMIN_EMAIL = "admin-hml@seudominio.com"
$env:LOAD_TEST_ADMIN_PASSWORD = "<senha-admin-hml>"
$env:LOAD_TEST_SCENARIO = "all"
$env:LOAD_TEST_VUS = "300"
$env:LOAD_TEST_TARGET_RPS = "45"
$env:LOAD_TEST_DURATION_SECONDS = "600"
$env:LOAD_TEST_HEAVY_VUS = "30"
$env:LOAD_TEST_HEAVY_RPS = "5"
$env:LOAD_TEST_HEAVY_DURATION_SECONDS = "180"
$env:LOAD_TEST_PROFILE_COUNT = "300"
$env:LOAD_TEST_USE_VIRTUAL_IPS = "true"
npm run load:staging
```

## Cenarios

### Fluxo comum
Inclui:
- login de paciente e admin/profissional
- refresh token
- `/auth/me`
- listagem de pacientes
- detalhe de paciente
- home do paciente
- anamnese profissional e do paciente
- evolucao
- atividades/plano
- check-in
- laudo
- CRM: command center, dashboard clinico, automacoes, pacientes paginados e pipeline

### Cenario pesado
Executado separado do p95 comum:
- sugestao IA de laudo
- PDF de laudo
- PDF de plano
- upload de exame medico
- listagem de exames

O timeout padrao do cenario pesado e `LOAD_TEST_HEAVY_TIMEOUT_MS=30000`. Se IA/PDF/upload ficarem instaveis, a decisao correta para producao e transformar esses fluxos em job assincrono com status de processamento.

## Relatorio
O JSON do resultado e gravado em:

```text
.local-logs/load-test-<runId>.json
```

O teste falha com exit code diferente de zero se:
- erro global do periodo de carga exceder `LOAD_TEST_ERROR_RATE_MAX`, padrao `0.01`;
- p95 de leitura exceder `LOAD_TEST_READ_P95_MS`, padrao `800`;
- p95 de escrita exceder `LOAD_TEST_WRITE_P95_MS`, padrao `1500`.

## Observacoes sobre rate limit
O backend limita login, registro e refresh por IP. Em teste local a partir de uma unica maquina, isso nao representa 300 usuarios reais. Para HML, use uma das opcoes:
- `LOAD_TEST_USE_VIRTUAL_IPS=true` com `TRUST_PROXY=true`;
- runners distribuidos;
- fixtures pre-criadas com tokens/usuarios suficientes.

Para reutilizar fixtures, informe:

```powershell
$env:LOAD_TEST_FIXTURES_FILE = "C:\caminho\fixtures-load-test.json"
```
