# Etapa 36 - Fila de imagens do catalogo

## Objetivo

Transformar o catalogo mestre em uma fila operacional para producao, revisao clinica e aprovacao de imagens dos exercicios, sem liberar automaticamente itens novos para prescricao.

## Endpoint administrativo

`GET /exercicios/admin/fila-imagens`

Disponivel apenas para `ADMIN`.

Filtros suportados:

- `q`
- `regiaoCorporal`
- `categoria`
- `nivel`
- `tag`
- `filaStatus`
- `limit`

## Tela administrativa

A tela `AdminExerciseCatalogScreen` consome a fila e mostra:

- resumo por status;
- filtro por status de producao;
- prioridade do item;
- atalho para abrir o exercicio no formulario de edicao;
- opcao explicita `Sem imagem` para preservar rascunhos do catalogo mestre sem asset.

## Status da fila

| Status                    | Uso                                                                             |
| ------------------------- | ------------------------------------------------------------------------------- |
| `SEM_IMAGEM`              | Exercicio ainda nao tem `imagemKey`; precisa de asset proprio e mapeamento.     |
| `SEM_MIDIA_PRINCIPAL`     | Exercicio tem `imagemKey`, mas nao possui midia principal ativa correspondente. |
| `IMAGEM_PENDENTE_REVISAO` | Imagem existe, mas ainda precisa de revisao clinica.                            |
| `REGENERAR_IMAGEM`        | Imagem foi revisada e precisa ser refeita.                                      |
| `AJUSTAR_TEXTO`           | Texto/instrucao precisa ajuste antes da aprovacao.                              |
| `REMOVER_DO_CATALOGO`     | Item deve ser avaliado para arquivamento/remocao.                               |

## Regra de seguranca

A fila nao altera o fluxo de prescricao. O paciente e o profissional continuam vendo apenas exercicios `APROVADO` com midia principal clinicamente `APROVADA`.

Um exercicio sem `imagemKey` nao pode ser salvo como `APROVADO`. Ele deve permanecer como `RASCUNHO` ate receber asset proprio, midia principal e revisao clinica.

Mesmo com `imagemKey`, o exercicio so pode virar `APROVADO` quando a midia principal correspondente estiver clinicamente `APROVADA`.

## Fluxo recomendado

1. Listar `SEM_IMAGEM` para selecionar o proximo lote de imagens.
2. Criar a imagem propria no padrao Synap.
3. Cadastrar ou associar `imagemKey`.
4. Revisar clinicamente a midia.
5. Marcar a midia como `APROVADA`.
6. Somente entao avaliar a mudanca do exercicio para `APROVADO`.
