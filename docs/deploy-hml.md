# Deploy HML (Render + Postgres/Supabase)

## Objetivo
Subir um ambiente de homologação (`hml`) estável para teste remoto (incluindo seu sócio) e validar mobile + CRM web antes de produção.

## 1. Preparar variáveis

### Backend
- Copie `apps/backend/.env.hml.example` como referência para o painel do provedor
- Configure no serviço HML:
  - `DB_*`
  - `JWT_SECRET`, `REFRESH_SECRET`
  - `INVITE_SECRET`
  - `CORS_ORIGIN`
  - `TRUST_PROXY=true`
  - `DB_SSL=true`
  - `SENTRY_DSN` (opcional/recomendado)

### Mobile/Web
- Copie `apps/mobile/.env.hml.example` como referência
- Configure:
  - `EXPO_PUBLIC_API_URL`
  - `EXPO_PUBLIC_MASTER_ADMIN_EMAILS`
  - `EXPO_PUBLIC_SENTRY_DSN` (opcional/recomendado)
  - `EXPO_PUBLIC_APP_ENV=hml`

## 2. Deploy do backend HML
- `apps/backend`: build command `npm install && npm run build`
- start command `npm run start` (ou `npm run start:prod`, conforme provedor)
- Após subir, validar `/api/health`

## 3. Migrations (HML)
Executar em `apps/backend` apontando para o banco HML:

```powershell
npm run migration:run
```

## 4. Smoke tests (HML)

### 4.1 Healthcheck
```powershell
cd apps/backend
npm run smoke:health -- -BaseUrl https://api-hml.seudominio.com/api
```

### 4.2 Fluxo funcional (usuário + paciente + anamnese + evolução)
```powershell
cd apps/backend
npm run quick-test -- -BaseUrl https://api-hml.seudominio.com/api
```

## 5. Validar frontends

### Mobile
- apontar `EXPO_PUBLIC_API_URL` para HML
- gerar APK/test build
- validar login/cadastro/anamnese/evolução/check-ins

### CRM web
- abrir `http://localhost:8081/admin/crm?crm=1` (web local) consumindo API HML
- validar:
  - score de conta
  - automações
  - filtros
  - exportações

## 6. Checklist de aceite HML
- `/api/health` = `ok`
- migrations aplicadas
- login/cadastro funcionando
- CRM web carregando
- Sentry recebendo erro de teste (se configurado)
- sem erro recorrente em fluxo crítico
