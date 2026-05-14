# Etapa 19 - Checklist de Execucao

Data: 2026-04-18
Branch: `etapa-19-melhoria-fluxo`

## 1) Backend commit/push
- [x] Mudancas do backend consolidadas para escopo de pacientes por criacao/vinculo.
- [x] Build local validado a partir de `src`.
- [x] Pronto para commit e push.

## 2) Padrao para `dist`/artefatos
- [x] Encerrado versionamento de `apps/backend/dist`; artefatos passam a ser gerados no build.
- [x] Evitada sujeira recorrente de ambiente local: `dist/` e `*.tsbuildinfo` permanecem ignorados.
- [x] Removido gate `check:dist`; CI/release validam build e testes em vez de artefatos gerados.

## 3) Validacao minima executada
- [x] Frontend: `npm run -s check:encoding` (ok).
- [x] Frontend: `npx tsc --noEmit` (ok).
- [x] Backend: `npm run -s build` (ok).
- [x] Backend: `npm run lint:ci` e testes focados de metrics/CRM apos telemetria operacional (ok).
- [x] Backend: `npm run check:encoding` apos gate explicito de release (ok).
- [x] Frontend: `npm run validate:critical` apos telemetria operacional (ok).
- [x] Frontend: `npm run validate:critical` apos unificacao de prontidao/CTA clinico (ok).
- [x] CI/release: `release-gates.ps1` validado por parse apos expor `check:encoding`.
- [x] Backend: politica alterada para nao versionar `apps/backend/dist`, eliminando gate sobre artefato gerado.
- [x] Backend: `npm run validate:critical:ci` apos politica de `dist` sem versionamento (44 suites / 206 testes, ok).
- [x] Backend: smoke e2e local repetivel disponivel via `npm run smoke:e2e:local`.
- [x] Backend: health local por boot temporario e `GET /api/health` (200).
- [x] Backend: `npm run -s quick-test` validando fluxo login -> paciente -> anamnese -> evolucao (ok).

## 4) Backlog tecnico imediato (proxima sequencia)
- [x] Consolidar telemetria em visualizacao operacional (eventos de bloqueio, abandono e autosave).
- [x] Fechar smoke e2e repetivel (script unico com sobe/desce backend e assert de endpoints chave).
- [x] Revisao final de UX de prontidao/CTA por paciente em todos os caminhos de entrada.
- [x] Monitorar regressao de encoding no CI usando `check:encoding` como gate obrigatorio.
- [x] Remover `apps/backend/dist` do versionamento e manter build como fonte de verdade.

## 5) Fechamento operacional
- [x] Nao ha item funcional aberto na etapa 19.
- [x] Pendencias abertas encontradas nos docs pertencem a etapa 23/QA, fora deste escopo.
- [x] `release-gates.ps1` nao depende mais de `apps/backend/dist` versionado.

## Critérios de aceite desta etapa
- [x] Escopo de pacientes visivel no Home/Pacientes respeita criacao direta ou vinculo ativo.
- [x] Validacoes tecnicas de compilacao e encoding passaram.
- [x] Artefatos de build nao sao mais versionados; consistencia passa por build/testes.
