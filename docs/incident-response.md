# Incident Response (MVP)

## Objetivo
Responder rápido a incidentes de indisponibilidade/erro sem improviso.

## 1. Classificação inicial
- **P0**: app/backend indisponível para todos (login/API fora)
- **P1**: funcionalidade crítica quebrada (cadastro, evolução, CRM) com workaround parcial
- **P2**: erro não crítico / degradação localizada

## 2. Checklist rápido (primeiros 5 minutos)
- Confirmar se `GET /api/health` responde
- Verificar logs recentes (requestId, 5xx)
- Verificar Sentry (backend/mobile/web)
- Confirmar status do banco (conexão/latência)
- Confirmar deploy/migration recente

## 3. Cenários comuns e ação

### API fora do ar
- Verificar serviço no provedor (Render/Railway/etc.)
- Reiniciar serviço se necessário
- Confirmar variáveis de ambiente
- Validar `/api/health`

### Banco indisponível
- Verificar credenciais/SSL/rede
- Confirmar status no provedor do Postgres
- Se incidente persistir: avaliar failover/restore

### Erro 500 após deploy
- Identificar rota afetada
- Verificar Sentry + logs por `requestId`
- Confirmar migration aplicada
- Fazer rollback do deploy se necessário

### App com erro de runtime
- Verificar Sentry mobile/web
- Identificar tela/versão/ação do usuário
- Publicar correção e distribuir em canal de teste

## 4. Comunicação (mínima)
- Registrar:
  - horário de início
  - impacto
  - causa (se conhecida)
  - ação tomada
  - horário de normalização

## 5. Encerramento
- Confirmar fluxo crítico funcionando:
  - login
  - pacientes
  - anamnese/evolução
  - CRM web
- Criar item de prevenção (ex.: alerta, teste, validação)
