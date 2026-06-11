# Deploy HML - Render + Supabase

## Objetivo
Subir a branch `etapa-32-pre-prod` em homologacao usando Render para backend/frontend e Supabase para Postgres + Storage.

## 1. Supabase

Crie ou selecione o projeto HML no Supabase.

Banco:
- Use o Postgres do projeto.
- No Render, prefira a connection string de pooler em modo Session se o host direto do banco nao conectar.
- Preencha no backend:
  - `DB_HOST`: host do Supabase ou do Session Pooler
  - `DB_PORT`: geralmente `5432`
  - `DB_USERNAME`: usuario da connection string
  - `DB_PASSWORD`: senha do banco
  - `DB_DATABASE`: geralmente `postgres`
  - `DB_SSL=true`
  - `DB_SSL_REJECT_UNAUTHORIZED=false`

Storage:
- Crie o bucket privado `paciente-exames`.
- Use a service role key apenas no backend.
- Preencha:
  - `SUPABASE_URL=https://<project-ref>.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
  - `SUPABASE_STORAGE_BUCKET=paciente-exames`

## 2. Render Backend

Se o servico foi criado manualmente no Render, o `render.yaml` do repo nao muda os comandos/env automaticamente. Nesse caso, copie estas configuracoes no painel do servico. Se usar Blueprint, sincronize o Blueprint a partir do `render.yaml` raiz.

Servico:
- Branch: `etapa-32-pre-prod`
- Root Directory: `apps/backend`
- Build Command: `npm ci --include=dev && npm run build`
- Pre-Deploy Command: `npm run migration:run`
- Start Command: `npm run start:prod`
- Health Check Path: `/api/health/live`

Variaveis obrigatorias:
- `NODE_ENV=production`
- `PORT=10000`
- `TRUST_PROXY=true`
- `DB_MIGRATIONS_RUN=false`
- `DB_SSL=true`
- `DB_SSL_REJECT_UNAUTHORIZED=false`
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_SECRET`, `REFRESH_SECRET`, `INVITE_SECRET`
- `CORS_ORIGIN`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
- `CONSENT_TERMS_VERSION`
- `CONSENT_PRIVACY_VERSION`
- `CONSENT_RESEARCH_VERSION`
- `CONSENT_AI_VERSION`
- `CONSENT_PROFESSIONAL_LGPD_VERSION`

Secrets:

```powershell
npm --prefix apps/backend run secrets:render
```

Copie a saida para o Environment do Render. Cada secret precisa ter pelo menos 32 caracteres e nao pode ser placeholder.

Valores recomendados para HML:
- `DB_POOL_MAX=8`
- `DB_POOL_MIN=0`
- `DB_POOL_IDLE_TIMEOUT_MS=10000`
- `DB_POOL_CONNECTION_TIMEOUT_MS=10000`
- `DB_STATEMENT_TIMEOUT_MS=30000`
- `JWT_EXPIRES_IN=7d`
- `REFRESH_EXPIRES_IN=30d`
- `SENTRY_REQUIRED=false`
- `SENTRY_DSN=` vazio, ou `SENTRY_REQUIRED=true` com DSN real
- `ALLOW_ADMIN_REGISTRATION=false`
- `MASTER_ADMIN_EMAILS=<emails master separados por virgula>`
- `PATIENT_INVITE_BASE_URL=https://<frontend-render>.onrender.com/cadastro-paciente`

`CORS_ORIGIN` deve conter a URL do frontend Render, sem wildcard:

```text
https://<frontend-render>.onrender.com,http://localhost:8083
```

## 3. Render Frontend

Servico static:
- Branch: `etapa-32-pre-prod`
- Root Directory: `apps/mobile`
- Build Command: `npm ci && npm run build:web`
- Publish Directory: `dist`
- Rewrite: `/*` para `/index.html`

Variaveis:
- `EXPO_PUBLIC_API_URL=https://<backend-render>.onrender.com/api`
- `EXPO_PUBLIC_MASTER_ADMIN_EMAILS=<mesmos emails master>`
- `EXPO_PUBLIC_ENABLE_SPEECH_TO_TEXT=true`
- `EXPO_PUBLIC_APP_ENV=hml`
- `EXPO_PUBLIC_SENTRY_DSN=` vazio ou DSN publico

Depois de alterar `EXPO_PUBLIC_*`, faca novo deploy do frontend. Essas variaveis entram no bundle durante o build.

## 4. Validacao

Backend:

```powershell
curl.exe https://<backend-render>.onrender.com/api/health/live
curl.exe https://<backend-render>.onrender.com/api/health/ready
```

Esperado:
- `/live`: `status=ok`
- `/ready`: `status=ok` e `checks.db.status=up`

Frontend:
- Abra `https://<frontend-render>.onrender.com/admin/crm`.
- Login CRM master deve chamar `https://<backend-render>.onrender.com/api`.

## 5. Erros comuns

Erro de secret:
- `JWT_SECRET deve ter pelo menos 32 caracteres...`
- `REFRESH_SECRET deve ter pelo menos 32 caracteres...`
- `INVITE_SECRET deve ter pelo menos 32 caracteres...`

Correcao: gere novos valores com `npm --prefix apps/backend run secrets:render` e substitua os tres no Render.

Erro de Supabase:
- `SUPABASE_URL obrigatorio em producao`
- `SUPABASE_SERVICE_ROLE_KEY obrigatorio em producao`
- `SUPABASE_STORAGE_BUCKET obrigatorio em producao`

Correcao: preencha os tres no servico backend do Render. Eles nao pertencem ao frontend.

Erro de CORS:
- CRM abre, mas login falha no navegador.

Correcao: inclua a URL exata do frontend em `CORS_ORIGIN`, sem `*`, e redeploy backend.

Erro por `render.yaml` ignorado:
- Log do Render mostra comandos diferentes do repo, por exemplo `npm ci && npm run build` quando o repo define `npm ci --include=dev && npm run build`.

Correcao: o servico e manual. Copie os comandos/env no painel ou recrie/sincronize via Blueprint.
