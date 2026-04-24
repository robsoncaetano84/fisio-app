# Checklist de Fechamento Orquestrador (1 dia)

Objetivo: fechar GO/NO-GO final do "Charles" com evidência técnica e clínica rastreável.

## Janela sugerida
- Duração total: ~4h a 6h
- Responsáveis: técnico (execução scripts) + clínico (validação semântica)

## 1) Gate técnico completo
1. No diretório raiz do projeto:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\release-gates.ps1 -BaseUrl "https://fisio-backend-pax6.onrender.com/api" -EnableAuthMonitor -MonitorWindowMinutes 5 -MonitorIntervalSeconds 15
```
2. Resultado esperado:
- Report em `logs/release-gates-YYYYMMDD-HHMMSS.md`
- Status final `GO`

## 2) Monitoramento autenticado 5xx (confirmação isolada)
1. Definir credenciais de monitor:
```powershell
$env:MONITOR_IDENTIFIER = "<EMAIL_OU_CPF>"
$env:MONITOR_PASSWORD   = "<SENHA>"
```
2. Executar monitor:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\monitor-clinical-5xx.ps1 -BaseUrl "https://fisio-backend-pax6.onrender.com/api" -UseEnvCredentials -WindowMinutes 5 -IntervalSeconds 15
```
3. Critério objetivo:
- `Total5xx = 0`
- `TotalTransportErrors = 0`

## 3) QA clínico manual (cenários A/B/C)
1. Executar os três cenários:
- `docs/qa-execucao-cenario-a-joelho.md`
- `docs/qa-execucao-cenario-b-lombar-neural.md`
- `docs/qa-execucao-cenario-c-ombro-esportivo.md`
2. Registrar resultado em:
- `docs/qa-etapa-23-matriz-execucao.md`

## 4) Checagem de governança no app
1. Confirmar no fluxo:
- sugestão IA visível com `confidence`, `reason`, `evidenceFields`
- confirmação profissional exigida em campos críticos
- protocolo exibido (nome/versão) em next action e sugestões assistivas
2. Confirmar no CRM Admin:
- resumo de adoção IA com filtros e timeline

## 5) Encerramento documental
1. Atualizar `docs/release-go-no-go-etapa-23.md`:
- trocar `Status: NO-GO` para `GO` somente após critérios acima
- anexar os caminhos dos relatórios em `logs/`
2. Commit final com evidências.

## Critérios de sucesso (definitivo)
- Gate técnico: `GO`
- Monitor autenticado: sem 5xx
- Cenários clínicos A/B/C: aprovados
- Governança e rastreabilidade: confirmadas
