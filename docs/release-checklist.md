# Release Checklist

## 1. Build e tipagem
- `apps/backend`: `npm run build`
- `apps/mobile`: `npx tsc --noEmit`

## 2. Banco e migrations
- Validar variáveis `DB_*` do ambiente alvo
- Executar `npm run migration:run` em `apps/backend`
- Confirmar tabela `migrations` atualizada

## 3. Saúde do backend
- `GET /api/health` retorna `200` (`status: ok`)
- Verificar `checks.db.status = ok`
- Confirmar `TRUST_PROXY=true` em produção (se atrás de proxy)
- Confirmar `DB_SSL` / `DB_SSL_REJECT_UNAUTHORIZED`

## 4. Segurança e configuração
- `ALLOW_ADMIN_REGISTRATION=false`
- `MASTER_ADMIN_EMAILS` configurado
- `JWT_SECRET` / `REFRESH_SECRET` fortes
- `CORS_ORIGIN` restrito ao ambiente
- `SENTRY_DSN` (backend) configurado
- `EXPO_PUBLIC_SENTRY_DSN` (mobile/web) configurado (se usar)

## 5. Smoke test funcional (mobile + web)
- Login / logout
- Cadastro profissional
- Cadastro paciente (com e sem convite)
- Anamnese / Evolução
- Check-in conversacional
- Prescrição adaptativa (card de sugestão)
- Home (checklist onboarding / prioridades)
- CRM web (`/admin/crm?crm=1`)
- CRM: score de conta, automações, filtros e exportações

## 6. Observabilidade
- Uptime monitor ativo em `/api/health`
- Sentry recebendo erro de teste (backend e app)
- Logs de request com `X-Request-Id`

## 7. Pós-release
- Monitorar erros 15-30 min
- Validar endpoints principais e login
- Conferir feedback de usuários/testadores
