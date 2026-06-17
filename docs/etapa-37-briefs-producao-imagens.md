# Etapa 37 - Briefs de producao de imagens

## Objetivo

Padronizar a criacao das imagens proprias do catalogo de exercicios antes de qualquer aprovacao clinica.

Cada exercicio pendente na fila de imagens agora pode gerar um brief de producao com:

- chave sugerida para o `imagemKey`;
- nome de arquivo JPG sugerido;
- caminho sugerido do asset em `apps/mobile/assets/exercises`;
- titulo e texto resumido para o paciente;
- orientacao resumida para o profissional;
- label de acessibilidade para a imagem;
- ficha completa em Markdown para selecao/copia;
- checklist tecnico para integrar o asset no mobile/backend;
- objetivo visual;
- prompt base para gerar/refazer a imagem;
- prompt negativo;
- criterios de enquadramento;
- regras de identidade visual;
- criterios clinicos;
- checklist de revisao.

## Endpoint administrativo

`GET /exercicios/admin/:id/brief-imagem`

Retorna brief apenas para exercicios ativos que ainda estao na fila de producao de imagem:

- `SEM_IMAGEM`
- `SEM_MIDIA_PRINCIPAL`
- `IMAGEM_PENDENTE_REVISAO`
- `REGENERAR_IMAGEM`
- `AJUSTAR_TEXTO`
- `REMOVER_DO_CATALOGO`

Se o exercicio ja possui imagem principal clinicamente aprovada, o endpoint retorna erro porque ele nao precisa mais de brief de producao.

## Endpoint administrativo em lote

`GET /exercicios/admin/briefs-imagens`

Aceita os mesmos filtros da fila:

- `q`
- `regiaoCorporal`
- `categoria`
- `nivel`
- `tag`
- `filaStatus`
- `limit`

Retorna os briefs da fila ja ordenados por prioridade, junto dos filtros aplicados (`appliedFilters`) e de uma ficha consolidada com a secao `Filtros aplicados`. Use este endpoint para produzir um pacote de imagens sem abrir cada exercicio manualmente.

## Endpoint Markdown em lote

`GET /exercicios/admin/briefs-imagens/markdown`

Aceita os mesmos filtros do endpoint em lote e retorna apenas a ficha consolidada em `text/markdown`. Use quando precisar abrir, salvar ou copiar o pacote de producao fora da tela administrativa.

Na tela administrativa do catalogo, o botao `Briefs` na fila de imagens carrega ate 10 briefs do filtro atual de busca e status (`Todos`, `Sem imagem`, `Regenerar`, etc.) e mostra chave, arquivo sugerido, caminho do asset, texto do paciente, checklist tecnico, prompt base e ficha completa em texto selecionavel. A busca considera nome, slug, regiao, categoria, nivel, `imagemKey`, objetivo, descricao e tags. O pacote tambem exibe uma ficha consolidada unica com acao `Copiar` para enviar o lote completo para producao. Cada item do pacote abre o exercicio no editor para revisar a midia individual, e o painel do brief individual tambem possui acao `Copiar` para copiar apenas a ficha daquele exercicio.

## Fluxo operacional

1. Abrir o catalogo administrativo.
2. Selecionar um item da fila de imagens.
3. Conferir o brief gerado no painel lateral.
4. Produzir ou regenerar a imagem seguindo o prompt e o checklist.
5. Salvar o JPG em `apps/mobile/assets/exercises`.
6. Associar a chave no backend e no mapeamento mobile.
7. Marcar a revisao clinica da imagem como `APROVADA` somente apos validacao profissional.
8. Aprovar o exercicio apenas quando a midia principal estiver clinicamente aprovada.

## Padrao visual

- Ilustracao propria Synap, sem logos externos, sem watermark e sem texto embutido.
- Anatomia limpa em tons de cinza, com musculatura relevante em verde Synap.
- Fundo claro, alta nitidez e leitura boa em miniatura.
- Vista 3/4 quando a posicao dos apoios ou a alternancia de membros puder gerar ambiguidade.

## Regra clinica importante

Movimentos alternados precisam respeitar contralateralidade real. Exemplo: em bird dog, braco direito estendido exige perna esquerda estendida, com mao esquerda e joelho direito apoiados.
