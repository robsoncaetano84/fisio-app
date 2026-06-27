# Etapa 37 - Briefs de produção de imagens

## Objetivo

Padronizar a criação das imagens próprias do catálogo de exercícios antes de qualquer aprovação clínica.

Cada exercício pendente na fila de imagens agora pode gerar um brief de produção com:

- chave sugerida para o `imagemKey`;
- nome de arquivo JPG sugerido;
- caminho sugerido no bucket `exercise-images` do Supabase Storage;
- título e texto resumido para o paciente;
- orientação resumida para o profissional;
- label de acessibilidade para a imagem;
- ficha completa em Markdown para seleção/cópia;
- checklist técnico para integrar o asset no mobile/backend;
- objetivo visual;
- prompt base para gerar/refazer a imagem;
- prompt negativo;
- critérios de enquadramento;
- regras de identidade visual;
- critérios clínicos;
- checklist de revisão.

## Endpoint administrativo

`GET /exercicios/admin/:id/brief-imagem`

Retorna brief apenas para exercícios ativos que ainda estão na fila de produção de imagem:

- `SEM_IMAGEM`
- `SEM_MIDIA_PRINCIPAL`
- `IMAGEM_PENDENTE_REVISAO`
- `REGENERAR_IMAGEM`
- `AJUSTAR_TEXTO`
- `REMOVER_DO_CATALOGO`

Se o exercício já possui imagem principal clinicamente aprovada, o endpoint retorna erro porque ele não precisa mais de brief de produção.

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

Retorna os briefs da fila já ordenados por prioridade, junto dos filtros aplicados (`appliedFilters`) e de uma ficha consolidada com a seção `Filtros aplicados`. Use este endpoint para produzir um pacote de imagens sem abrir cada exercício manualmente.

## Endpoint Markdown em lote

`GET /exercicios/admin/briefs-imagens/markdown`

Aceita os mesmos filtros do endpoint em lote e retorna apenas a ficha consolidada em `text/markdown`. Use quando precisar abrir, salvar ou copiar o pacote de produção fora da tela administrativa.

Na tela administrativa do catálogo, o botão `Briefs` na fila de imagens carrega até 10 briefs do filtro atual de busca e status (`Todos`, `Sem imagem`, `Regenerar`, etc.) e mostra chave, arquivo sugerido, caminho do asset, texto do paciente, checklist técnico, prompt base e ficha completa em texto selecionável. A busca considera nome, slug, região, categoria, nível, `imagemKey`, objetivo, descrição e tags. O pacote também exibe uma ficha consolidada única com ação `Copiar` para enviar o lote completo para produção. Cada item do pacote abre o exercício no editor para revisar a mídia individual, e o painel do brief individual também possui ação `Copiar` para copiar apenas a ficha daquele exercício.

## Fluxo operacional

1. Abrir o catálogo administrativo.
2. Selecionar um item da fila de imagens.
3. Conferir o brief gerado no painel lateral.
4. Produzir ou regenerar a imagem seguindo o prompt e o checklist.
5. Publicar `thumb.jpg` e `full.jpg` no bucket `exercise-images`.
6. Registrar `storagePath`, `thumbnailUrl`, `imageUrl` e metadados via `PATCH /exercicios/{id}/midia-principal-storage`.
7. Associar a chave no backend quando o exercício virar catálogo oficial.
8. Marcar a revisão clínica da imagem como `APROVADA` somente após validação profissional.
9. Aprovar o exercício apenas quando a mídia principal estiver clinicamente aprovada.

## Padrão visual obrigatório

Este padrão deve bloquear qualquer imagem que não esteja consistente com o restante do catálogo.

- Ilustração própria Synap, sem logos externos, sem marca d'água e sem texto embutido.
- Adulto neutro, sem identidade facial forte, sem rosto borrado e sem aparência de pessoa real identificável.
- Roupa esportiva justa cinza-claro/off-white, sem logo e sem troca de figurino entre exercícios.
- Fundo claro, limpo e uniforme, sem cenário clínico poluído e sem objetos desnecessários.
- Corpo e roupa em tons suaves de cinza, com anatomia limpa e leitura boa em miniatura.
- Destaque verde Synap somente no músculo-alvo ou na direção do movimento, com setas discretas quando ajudarem a compreensão.
- Não usar roupa escura, roupa colorida, tórax exposto, nudez anatômica ou aparência de atlas anatômico sem roupa.
- Não usar marca d'água, assinatura, texto, número, legenda ou ícone que pareça externo ao app.
- Preferir vista 3/4 quando a posição dos apoios ou a alternância de membros puder gerar ambiguidade.
- Evitar fantasma visual forte; quando houver duas posições, usar sobreposição discreta ou duas poses limpas no mesmo padrão.
- Manter proporção, escala corporal, nível de detalhe e intensidade do verde semelhantes aos assets já aprovados.

## Critério de rejeição visual

A imagem deve ser descartada ou regenerada quando apresentar qualquer um destes problemas:

- roupa escura, colorida, com logo ou diferente do padrão cinza-claro/off-white;
- torso exposto, aparência de modelo anatômico sem roupa ou músculos expostos;
- rosto borrado, identidade facial forte demais ou aparência de pessoa real identificável;
- fundo escuro, cenário clínico poluído, equipamentos desnecessários ou sombras pesadas;
- destaque verde excessivo, em região errada ou sem relação com o movimento;
- texto embutido, marca d'água, assinatura, letras, números ou artefatos de geração;
- pose clinicamente impossível, ambígua ou com contralateralidade incorreta;
- recorte que prejudique mãos, pés, apoios, direção do movimento ou leitura em miniatura.

## Regra clínica importante

Movimentos alternados precisam respeitar contralateralidade real. Exemplo: em bird dog, braço direito estendido exige perna esquerda estendida, com mão esquerda e joelho direito apoiados.

## Lote cervical 01

Geradas e integradas 8 imagens próprias em JPG para revisão clínica:

- Retração cervical em pé na parede.
- Retração cervical em decúbito com toalha.
- Flexão cervical ativa curta.
- Rotação cervical em decúbito dorsal.
- Inclinação cervical sem apoio manual.
- Isometria cervical em flexão com mão.
- Isometria cervical em extensão na parede.
- Isometria cervical lateral bilateral.

Os assets seguem o padrão de adulto neutro, roupa esportiva cinza-claro/off-white, fundo claro, sem texto e sem marca d'água. A migration `1781600000000-AddCervicalMasterExerciseImages` mantém os exercícios como `RASCUNHO` e registra a mídia como `PENDENTE` até aprovação clínica.

Prévia visual: `.local-logs/etapa-37-preview-cervical-lote-01.jpg`.

## Lote cervical/ATM 02

Geradas e integradas mais 8 imagens próprias em JPG para revisão clínica:

- Deslizamento cervical com toalha.
- Alongamento do elevador da escápula sentado.
- Mobilidade suboccipital com toalha.
- Controle ocular cervical sentado.
- Protração e retração cervical sentada.
- Abertura mandibular controlada.
- Desvio lateral mandibular controlado.
- Protrusão mandibular suave.

Prévia visual: `.local-logs/etapa-37-preview-cervical-atm-lote-02.jpg`.

## Lote piloto de correção visual

Após revisão de consistência, a produção em lote foi pausada para evitar novas imagens fora do padrão. Foi gerado um piloto com prompt-base mais rígido, ainda sem integração ao catálogo oficial:

- Isometria mandibular em abertura.
- Mobilidade cervical em quatro apoios.
- Rotação torácica livro aberto.
- Extensão torácica no rolo.

Prévia visual: `.local-logs/preview-piloto-padrao-identidade-visual-4.jpg`.

Este piloto deve ser aprovado visualmente antes de regenerar ou integrar novos exercícios em massa.
