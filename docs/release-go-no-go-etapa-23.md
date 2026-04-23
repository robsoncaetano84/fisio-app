# Release Decision - Etapa 23 (Go / No-Go)

## Escopo consolidado
- Expansao da anamnese com campos clinicos obrigatorios.
- Exame fisico estruturado por regioes com validacoes.
- Blocos de raciocinio clinico, diagnostico funcional e conduta orientada.
- Refinos de UX para acelerar preenchimento (baterias por perfil/regiao).
- Pacote QA com cenarios A/B/C e matriz de execucao.
- Cobertura automatizada minima para validacao do exame estruturado no backend.

## Criterios de GO (todos obrigatorios)
- [x] Cenario A aprovado tecnicamente (automacao)
- [x] Cenario B aprovado tecnicamente (automacao)
- [x] Cenario C aprovado tecnicamente (automacao)
- [ ] Sem bloqueadores criticos abertos na matriz QA
- [x] Validacoes tecnicas locais ok:
  - [x] `apps/mobile`: `npm run validate:critical`
  - [x] `apps/backend`: `npm run -s build`
  - [x] `apps/backend`: `npm run test -- modules/laudos/laudos.service.spec.ts`
- [x] Sem regressao de encoding/i18n detectada
- [ ] Sem erro 5xx recorrente nos endpoints clinicos

## Criterios de NO-GO (qualquer item abaixo)
- [ ] Falha em validacao neural obrigatoria (tipoLesao neural sem neurologico detalhado).
- [ ] Exame fisico permitindo salvar sem teste regional valido.
- [ ] Laudo/plano com conduta sem evidencia clinica minima em casos testados.
- [ ] Erro de persistencia em campos clinicos novos da anamnese.

## Risco residual aceito nesta release
- Dependencia de validacao clinica manual final para consistencia semantica dos textos IA.
- Cobertura automatizada ainda inicial (foco atual em validacao do exame estruturado).

## Plano de rollback
1. Reverter deploy para commit estavel anterior da branch de release.
2. Manter dados clinicos salvos (sem rollback de banco, exceto em migracao quebrada).
3. Reabrir matriz QA com causa raiz e patch corretivo.

## Decisao final
- Status: `PENDENTE` (preencher apos execucao da matriz QA)
- Responsavel:
- Data:
- Commit candidato:

## Status intermediario atual
- Estado: `PRONTO PARA VALIDACAO CLINICA`
- Motivo: todos os checks tecnicos e testes automatizados minimos passaram; faltam apenas evidencias dos cenarios A/B/C e monitoramento de 5xx.

## Atualizacao tecnica (2026-04-22)
- Validacoes tecnicas executadas com sucesso em ambiente local.
- Microcopias criticas de Exame Fisico/Laudo padronizadas em i18n (pt/en/es).
- Validacoes do Exame Fisico tambem migradas para i18n (sem hardcode local).
- Pendencias para virar `GO`:
  - aprovacao manual dos cenarios A/B/C na matriz QA;
  - confirmacao de ausencia de 5xx recorrente em uso real.

## Registro de execucao clinica (preencher)
| Item | Resultado | Evidencia |
|---|---|---|
| Cenario A (Joelho/Futebol) | Aprovado tecnico automatizado | docs/qa-execucao-cenario-a-joelho.md |
| Cenario B (Lombar/Neural) | Aprovado tecnico automatizado | docs/qa-execucao-cenario-b-lombar-neural.md |
| Cenario C (Ombro/Voleibol) | Aprovado tecnico automatizado | docs/qa-execucao-cenario-c-ombro-esportivo.md |
| Sem 5xx recorrente (monitoramento publico) | Aprovado | logs/monitor-clinical-5xx-*.md (ultimo: PASS em 2026-04-23) |
| Sem 5xx recorrente (monitoramento autenticado) | Reprovado (23/04/2026) | `logs/monitor-clinical-5xx-20260423-151620.md` (5x `500` em `GET /pacientes/paged`) |

### Correção aplicada após monitoramento autenticado (23/04/2026)
- Ajustada ordenação paginada em `PacientesService.findAll/findPaged` para usar propriedade de entidade (`p.nomeCompleto`) em vez de coluna crua (`p.nome_completo`), evitando erro interno de QueryBuilder em paginação.
- Após deploy dessa correção, rerodar monitor autenticado para confirmar `Total5xx = 0`.

## Regra objetiva de decisao final
- `GO` quando:
  - cenarios A, B e C = `Aprovado` (ou `Aprovado com ressalvas nao bloqueantes`);
  - sem bloqueador critico aberto;
  - sem 5xx recorrente nos endpoints clinicos.
- `NO-GO` quando:
  - qualquer cenario = `Reprovado`;
  - houver bloqueador critico aberto;
  - houver 5xx recorrente sem mitigacao.

## Comandos rapidos de rechecagem (antes do deploy)
```bash
# mobile
cd apps/mobile
npm run validate:critical

# backend
cd ../backend
npm run -s build
npm run test -- modules/laudos/laudos.service.spec.ts
npm run test -- modules/crm/crm.service.spec.ts
npm run test -- modules/crm/crm.controller.spec.ts
npm run test -- modules/clinical-governance/clinical-governance.service.spec.ts
npm run test -- modules/clinical-governance/clinical-governance.controller.spec.ts
npm run test -- modules/charles/charles.controller.spec.ts
npm run test -- modules/charles/charles.service.spec.ts
```

## Gate automatizado (recomendado)
```powershell
# no raiz do repositorio
powershell -ExecutionPolicy Bypass -File .\scripts\release-gates.ps1 -BaseUrl "http://localhost:3000/api"

# modo completo com monitoramento autenticado (usa MONITOR_IDENTIFIER/MONITOR_PASSWORD)
$env:MONITOR_IDENTIFIER = "<EMAIL_OU_CPF>"
$env:MONITOR_PASSWORD = "<SENHA>"
powershell -ExecutionPolicy Bypass -File .\scripts\release-gates.ps1 -BaseUrl "https://fisio-backend-pax6.onrender.com/api" -EnableAuthMonitor -MonitorWindowMinutes 5 -MonitorIntervalSeconds 15
```

Observações:
- O script gera um relatório em `logs/release-gates-YYYYMMDD-HHMMSS.md`.
- Para validar sem ambiente backend em execução local: `-SkipSmoke`.

## Drill de rollback (simulado, sem mutação)
```powershell
# valida alvo de rollback e gera plano + diff em relatório
powershell -ExecutionPolicy Bypass -File .\scripts\rollback-drill.ps1 -TargetCommit "HEAD~1"
```

Observações:
- Gera relatório em `logs/rollback-drill-YYYYMMDD-HHMMSS.md`.
- Não executa `reset`/`push`; apenas valida o procedimento e prepara evidência.

## Monitoramento de 5xx (pré-go-live)
```powershell
# modo sem auth (somente endpoints públicos, ex.: /health)
powershell -ExecutionPolicy Bypass -File .\scripts\monitor-clinical-5xx.ps1 -BaseUrl "https://fisio-backend-pax6.onrender.com/api" -WindowMinutes 5 -IntervalSeconds 15

# modo autenticado (inclui endpoints clínicos protegidos)
powershell -ExecutionPolicy Bypass -File .\scripts\monitor-clinical-5xx.ps1 -BaseUrl "https://fisio-backend-pax6.onrender.com/api" -BearerToken "<TOKEN>" -WindowMinutes 5 -IntervalSeconds 15

# modo autenticado com login automatico
powershell -ExecutionPolicy Bypass -File .\scripts\monitor-clinical-5xx.ps1 -BaseUrl "https://fisio-backend-pax6.onrender.com/api" -Identifier "<EMAIL_OU_CPF>" -Password "<SENHA>" -WindowMinutes 5 -IntervalSeconds 15
```

Observações:
- Gera relatório em `logs/monitor-clinical-5xx-YYYYMMDD-HHMMSS.md`.
- Critério objetivo: `Total5xx = 0` e `TotalTransportErrors = 0` durante a janela monitorada.

### Token rapido para monitoramento autenticado (alternativa)
```powershell
$base = "https://fisio-backend-pax6.onrender.com/api"
$body = @{ identificador = "<EMAIL_OU_CPF>"; senha = "<SENHA>" } | ConvertTo-Json
$resp = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body $body
$token = $resp.token
powershell -ExecutionPolicy Bypass -File .\scripts\monitor-clinical-5xx.ps1 -BaseUrl $base -BearerToken $token -WindowMinutes 5 -IntervalSeconds 15
```

### Modo seguro por variaveis de ambiente
```powershell
$env:MONITOR_IDENTIFIER = "<EMAIL_OU_CPF>"
$env:MONITOR_PASSWORD = "<SENHA>"
powershell -ExecutionPolicy Bypass -File .\scripts\monitor-clinical-5xx.ps1 -BaseUrl "https://fisio-backend-pax6.onrender.com/api" -UseEnvCredentials -WindowMinutes 5 -IntervalSeconds 15
```
