# Feature Flags por Usuario (Sprint 6)

## Objetivo
Controlar rollout progressivo do Clinical Orchestrator e modulos administrativos por usuario, sem novo deploy.

## Endpoints
- `GET /api/auth/feature-flags` (autenticado)
- `/api/auth/login` retorna `featureFlags` no payload
- `/api/auth/me` retorna `featureFlags` no payload

## Variaveis de ambiente (backend)

### Flags globais (fallback)
- `ENABLE_SPEECH_TO_TEXT` (`true|false`, default: `true`)
- `REQUIRE_AI_SUGGESTION_CONFIRMATION` (`true|false`, default: `true`)
- `ENABLE_CRM_ADMIN_WEB` (`true|false`, default: `true`)
- `ENABLE_CLINICAL_ORCHESTRATOR` (`true|false`, default: `true`)

### Override por usuario
- `FEATURE_FLAGS_BY_EMAIL` (JSON)

Formato:
```json
{
  "*": {
    "speechToText": true,
    "requireAiSuggestionConfirmation": true,
    "crmAdminWeb": false,
    "clinicalOrchestrator": false
  },
  "robsoncaetano84@gmail.com": {
    "crmAdminWeb": true,
    "clinicalOrchestrator": true
  }
}
```

Regras:
1. Backend aplica flags globais como default.
2. Aplica `FEATURE_FLAGS_BY_EMAIL["*"]` se existir.
3. Aplica `FEATURE_FLAGS_BY_EMAIL[email_do_usuario]` se existir.
4. Se role nao for `ADMIN`, `crmAdminWeb` e sempre `false`.

## Exemplo de rollout recomendado
1. Produzir baseline seguro:
   - `ENABLE_CLINICAL_ORCHESTRATOR=true`
   - `ENABLE_CRM_ADMIN_WEB=true`
2. Restringir por padrao:
   - em `FEATURE_FLAGS_BY_EMAIL`, usar `*` com `crmAdminWeb=false`.
3. Liberar gradualmente por e-mail:
   - adicionar administradores autorizados no JSON.
4. Monitorar:
   - `scripts/release-gates.ps1`
   - logs de erro e auditoria.

## Validacao rapida
1. Login com usuario alvo.
2. Chamar `GET /api/auth/feature-flags`.
3. Confirmar refletido no app:
   - CRM admin visivel apenas quando `crmAdminWeb=true`.
   - comportamento IA conforme `requireAiSuggestionConfirmation`.

## Rollback rapido
1. Ajustar `FEATURE_FLAGS_BY_EMAIL` para desativar o recurso.
2. Salvar env no Render.
3. Forcar novo login na sessao do usuario (renovar token/flags).
