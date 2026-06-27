# Etapa 35 - Catalogo mestre 300

## Objetivo

Expandir a base propria do Synap para 300 exercicios planejados, sem liberar novos itens para prescricao antes da revisao clinica e da criacao de imagem propria.

## Estado apos a etapa 34

- 18 exercicios base com imagem propria.
- 70 exercicios de expansao com imagem propria em preview, todos como rascunho/pendentes de revisao clinica.
- Total com asset especifico: 88.

## Incremento desta etapa

A etapa 35 adiciona 212 exercicios ao catalogo mestre como `RASCUNHO`, sem `imagemKey` e sem midia principal. Eles aparecem apenas para manutencao/admin e nao entram na prescricao profissional nem no casamento da IA ate receberem imagem, revisao clinica e status apropriado.

## Distribuicao dos 212 rascunhos

| Area                                  | Novos rascunhos |
| ------------------------------------- | --------------: |
| Cervical / ATM                        |              20 |
| Toracica / lombar / core              |              30 |
| Ombro / escapula                      |              30 |
| Cotovelo / punho / mao                |              22 |
| Quadril / pelve                       |              28 |
| Joelho                                |              28 |
| Tornozelo / pe                        |              26 |
| Equilibrio / marcha / quedas          |              18 |
| Respiracao / relaxamento / neuro leve |              10 |
| **Total**                             |         **212** |

## Regras de liberacao

1. Revisar clinicamente nome, objetivo, indicacao, contraindicacoes, progressao e regressao.
2. Criar uma imagem propria no padrao Synap.
3. Criar ou associar uma chave de imagem especifica no backend/mobile.
4. Registrar midia principal como `PENDENTE` e revisar clinicamente.
5. Somente alterar o exercicio para `APROVADO` quando a midia principal estiver `APROVADA`.

## Idiomas e acentuacao

- O cadastro canonico fica em PT-BR acentuado para nome, objetivo, descricao, instrucoes, cuidados e contraindicacoes.
- A coluna `translations` armazena textos por exercicio em `pt`, `en` e `es`.
- A tela de prescricao usa o idioma atual do app para mostrar e aplicar o exercicio ao plano do paciente.
- A busca do catalogo considera o texto canonico e as traducoes, para o profissional encontrar o item em PT-BR, ingles ou espanhol.

## Arquivos

- Seed: `apps/backend/src/modules/atividades/exercise-catalog-master.seed.ts`.
- Migration: `apps/backend/src/migrations/1781400000000-SeedMasterExerciseCatalog.ts`.
- Migration de idiomas/acentuacao: `apps/backend/src/migrations/1781500000000-AddExerciseTranslationsAndAccents.ts`.

## Observacao clinica

Este catalogo mestre e uma fila de trabalho. A prescricao final deve continuar sendo decisao do profissional e nenhum rascunho deve ser apresentado ao paciente antes de revisao humana.
