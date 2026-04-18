# Etapa 19 - Checklist de Execucao

Data: 2026-04-18
Branch: `etapa-19-melhoria-fluxo`

## 1) Backend commit/push
- [x] Mudancas do backend consolidadas para escopo de pacientes por criacao/vinculo.
- [x] Build atualizado em `apps/backend/dist`.
- [x] Pronto para commit e push.

## 2) Padrao para `dist`/artefatos
- [x] Mantido padrao atual do repositorio: `apps/backend/dist` continua versionado.
- [x] Evitada sujeira recorrente de ambiente local: adicionado `*.tsbuildinfo` em `.gitignore`.

## 3) Validacao minima executada
- [x] Frontend: `npm run -s check:encoding` (ok).
- [x] Frontend: `npx tsc --noEmit` (ok).
- [x] Backend: `npm run -s build` (ok).
- [x] Backend: health local por boot temporario e `GET /api/health` (200).
- [x] Backend: `npm run -s quick-test` validando fluxo login -> paciente -> anamnese -> evolucao (ok).

## 4) Backlog tecnico imediato (proxima sequencia)
- [ ] Consolidar telemetria em visualizacao operacional (eventos de bloqueio, abandono e autosave).
- [ ] Fechar smoke e2e repetivel (script unico com sobe/desce backend e assert de endpoints chave).
- [ ] Revisao final de UX de prontidao/CTA por paciente em todos os caminhos de entrada.
- [ ] Monitorar regressao de encoding no CI usando `check:encoding` como gate obrigatorio.

## Critérios de aceite desta etapa
- [x] Escopo de pacientes visivel no Home/Pacientes respeita criacao direta ou vinculo ativo.
- [x] Validacoes tecnicas de compilacao e encoding passaram.
- [x] Artefatos de build mantidos consistentes com codigo-fonte atual.
