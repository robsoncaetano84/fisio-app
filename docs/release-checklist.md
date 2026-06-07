# Release Checklist

## 1. Build e tipagem
- `apps/backend`: `npm run validate:critical`
- `apps/mobile`: `npx tsc --noEmit`

## 2. Infraestrutura
- Render em plano pago, sem cold start para API de produção
- Supabase em plano compatível com produção, com backups e retenção habilitados
- Definir `DB_POOL_MAX` conforme limite real de conexões do Supabase e quantidade de instâncias Render
- Confirmar storage bucket `paciente-exames` criado e privado
- Confirmar variáveis `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_STORAGE_BUCKET`

## 3. Banco e migrations
- Validar variáveis `DB_*` do ambiente alvo
- Confirmar `DB_SSL=true` em HML/produção
- Manter `DB_MIGRATIONS_RUN=false` em produção
- Executar `npm run migration:run` em `apps/backend`
- Confirmar tabela `migrations` atualizada

## 4. Saúde do backend
- `GET /api/health` retorna `200` (`status: ok`)
- `GET /api/health/live` retorna `200` sem depender do banco
- `GET /api/health/ready` retorna `200` somente com banco disponível
- Verificar `checks.db.status = ok`
- Confirmar `TRUST_PROXY=true` em produção atrás do Render/proxy
- Confirmar `DB_SSL_REJECT_UNAUTHORIZED` compatível com o certificado do provedor

## 5. Segurança e configuração
- `ALLOW_ADMIN_REGISTRATION=false`
- `MASTER_ADMIN_EMAILS` configurado
- `JWT_SECRET`, `REFRESH_SECRET` e `INVITE_SECRET` fortes, com 32+ caracteres
- `CORS_ORIGIN` restrito ao ambiente e sem wildcard
- `SENTRY_REQUIRED=true` e `SENTRY_DSN` real em HML/produção
- `EXPO_PUBLIC_SENTRY_DSN` real no mobile/web
- Versões de consentimento configuradas (`CONSENT_*_VERSION`)
- Checklist LGPD/IA/UX revisado em `docs/pre-prod-lgpd-ia-ux-checklist.md`

## 6. Smoke test funcional
- Login / logout
- Cadastro profissional
- Cadastro paciente com e sem convite
- Upload de exame médico
- Anamnese / Evolução
- Check-in conversacional
- Prescrição adaptativa
- Home com onboarding e prioridades
- CRM web (`/admin/crm?crm=1`)
- CRM: score de conta, automações, filtros e exportações

## 7. Observabilidade
- Uptime monitor ativo em `/api/health/ready`
- Sentry recebendo erro de teste, se configurado
- Logs de request com `X-Request-Id`
- Alertas para 5xx recorrente e falha de healthcheck
- Logs operacionais para IA, login, refresh token, upload e geração de laudo

## 8. Pós-release
- Monitorar erros por 30 minutos
- Validar endpoints principais e login
- Conferir feedback de usuários/testadores
- Registrar rollback plan antes de liberar novos usuários
