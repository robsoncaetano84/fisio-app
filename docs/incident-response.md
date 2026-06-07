# Incident Response (MVP)

## Objetivo
Responder rápido a incidentes de indisponibilidade ou erro sem improviso.

## 1. Classificação inicial
- **P0**: app/backend indisponível para todos, incluindo login/API
- **P1**: funcionalidade crítica quebrada, como cadastro, evolução ou CRM, com workaround parcial
- **P2**: erro não crítico ou degradação localizada

## 2. Checklist rápido
- Confirmar `GET /api/health/live` para saber se o processo está vivo
- Confirmar `GET /api/health/ready` para saber se API e banco estão prontos
- Verificar logs recentes por `X-Request-Id` e 5xx
- Verificar Sentry se estiver configurado
- Confirmar status do banco, conexão, SSL e latência
- Confirmar deploy ou migration recente

## 3. Cenários comuns e ação

### API fora do ar
- Verificar serviço no provedor, como Render
- Reiniciar serviço se necessário
- Confirmar variáveis de ambiente obrigatórias
- Validar `/api/health/live`

### Banco indisponível
- Validar `/api/health/ready`
- Verificar credenciais, SSL, rede e limite de conexões
- Confirmar status no Supabase
- Se incidente persistir, avaliar restore/failover conforme plano contratado

### Erro 500 após deploy
- Identificar rota afetada
- Verificar Sentry e logs por `X-Request-Id`
- Confirmar migration aplicada
- Fazer rollback do deploy se necessário

### App com erro de runtime
- Verificar Sentry mobile/web se estiver configurado
- Identificar tela, versão e ação do usuário
- Publicar correção e distribuir em canal de teste

## 4. Comunicação mínima
- Registrar horário de início
- Registrar impacto
- Registrar causa, se conhecida
- Registrar ação tomada
- Registrar horário de normalização

## 5. Encerramento
- Confirmar login
- Confirmar pacientes
- Confirmar anamnese/evolução
- Confirmar upload de exame médico
- Confirmar CRM web
- Criar item de prevenção, como alerta, teste ou validação
