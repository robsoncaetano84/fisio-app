# Deploy HML (Render + Supabase)

## Objetivo
Subir um ambiente de homologação (`hml`) estável para teste remoto e validar mobile + CRM web antes de produção.

## 1. Preparar infraestrutura
- Render em plano sem cold start para reduzir falso erro em testes
- Supabase com capacidade compatível com o volume de HML
- Banco Postgres com SSL habilitado
- Storage bucket privado `paciente-exames` criado
- Backups do Supabase revisados antes de liberar testes externos

## 2. Preparar variáveis

### Backend
- Copie `apps/backend/.env.hml.example` como referência para o painel do provedor
- Configure no serviço HML:
  - `DB_*`
  - `DB_SSL=true`
  - `DB_MIGRATIONS_RUN=false`
  - `DB_POOL_MAX`, `DB_POOL_MIN`, `DB_POOL_IDLE_TIMEOUT_MS`, `DB_POOL_CONNECTION_TIMEOUT_MS`
  - `JWT_SECRET`, `REFRESH_SECRET`, `INVITE_SECRET`
  - `CORS_ORIGIN`
  - `TRUST_PROXY=true`
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
  - `SENTRY_REQUIRED=true`, `SENTRY_DSN`
  - `CONSENT_TERMS_VERSION`, `CONSENT_PRIVACY_VERSION`, `CONSENT_RESEARCH_VERSION`, `CONSENT_AI_VERSION`, `CONSENT_PROFESSIONAL_LGPD_VERSION`

### Mobile/Web
- Copie `apps/mobile/.env.hml.example` como referência
- Configure:
  - `EXPO_PUBLIC_API_URL`
  - `EXPO_PUBLIC_MASTER_ADMIN_EMAILS`
  - `EXPO_PUBLIC_SENTRY_DSN`
  - `EXPO_PUBLIC_APP_ENV=hml`

## 3. Deploy do backend HML
- `apps/backend`: build command `npm install && npm run build`
- start command `npm run start:prod`
- Após subir, validar `/api/health/live` e `/api/health/ready`

## 4. Migrations HML
Executar em `apps/backend` apontando para o banco HML:

```powershell
npm run migration:run
```

Depois confirme se a tabela `migrations` foi atualizada.

## 5. Smoke tests HML

### 5.1 Healthcheck
```powershell
cd apps/backend
npm run smoke:health -- -BaseUrl https://api-hml.seudominio.com/api
```

### 5.2 Fluxo funcional
```powershell
cd apps/backend
npm run quick-test -- -BaseUrl https://api-hml.seudominio.com/api
```

## 6. Validar frontends

### Mobile
- apontar `EXPO_PUBLIC_API_URL` para HML
- gerar APK/test build
- validar login, cadastro, anamnese, exame físico, evolução e check-ins

### CRM web
- abrir `http://localhost:8081/admin/crm?crm=1` consumindo API HML
- validar:
  - score de conta
  - automações
  - filtros
  - exportações

## 7. Checklist de aceite HML
- `/api/health/live` = `ok`
- `/api/health/ready` = `ok`
- migrations aplicadas
- upload de exame médico funcionando no Supabase Storage
- login/cadastro funcionando
- CRM web carregando
- Sentry recebendo erro de teste, se configurado
- sem erro recorrente em fluxo crítico
