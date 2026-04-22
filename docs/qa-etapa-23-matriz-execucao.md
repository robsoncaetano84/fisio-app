# QA Etapa 23 - Matriz de Execucao

## Objetivo
Controlar resultado dos cenarios A/B/C de forma padronizada e rastreavel.

## Ambiente
- Branch:
- Backend URL:
- Front URL:
- Data/hora:
- Responsavel:

## Matriz (resumo)
| Cenario | Escopo | Status | Bloqueador | Evidencia |
|---|---|---|---|---|
| A - Joelho/Futebol | Anamnese + Exame + Laudo | Pendente | Nao | - |
| B - Lombar/Neural | Anamnese + Exame + Laudo | Pendente | Nao | - |
| C - Ombro/Voleibol | Anamnese + Exame + Laudo | Pendente | Nao | - |

Legenda status: `Pendente` | `Aprovado` | `Aprovado com ressalvas` | `Reprovado`.

## Criticos obrigatorios por cenario

### Cenario A
- [ ] Campos novos da anamnese persistem
- [ ] Exame salva com testes regionais validos
- [ ] Diagnostico/conduta condizem com achados de joelho

### Cenario B
- [ ] Bloqueio neural funciona sem neurologico detalhado
- [ ] Exame salva apos preencher neurologico detalhado
- [ ] Plano sugere progressao conservadora com criterio objetivo

### Cenario C
- [ ] Exame correlaciona ombro esportivo (subacromial/manguito)
- [ ] Plano indica retorno progressivo ao gesto esportivo
- [ ] Sem texto generico no laudo

## Regressoes gerais (qualquer cenario)
- [ ] Nao quebrou encoding/acentuacao
- [ ] Nao quebrou validacoes anteriores de anamnese
- [ ] Nao quebrou fluxo de salvar laudo/exame
- [ ] Sem erro 4xx/5xx inesperado nos endpoints principais

## Decisao final de homologacao
- Resultado geral:
- Pendencias remanescentes:
- Proximo passo:
