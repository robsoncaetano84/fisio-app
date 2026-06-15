# Etapa 34 - Imagem propria de exercicios

## Decisao

A etapa 34 usa uma base propria de exercicios e ilustracoes locais do Synap.
Nao usamos imagens aleatorias da internet, URL externa em prescricao, logo de terceiros ou geracao de imagem por IA a cada nova prescricao.

Motivos:
- custo recorrente zero para gerar/mostrar imagens;
- padrao visual consistente no app;
- menor risco de direito autoral, direito de imagem e atribuicao indevida;
- profissional e paciente veem a mesma referencia visual;
- o catalogo pode ser revisado e versionado clinicamente.

## Como funciona

### Backend

Tabelas principais:
- `exercicios`: catalogo proprio de exercicios, com nome, slug, regiao, categoria, nivel, objetivo, instrucoes, cuidados, contraindicacoes, tags, status e `imagem_key`.
- `exercicio_midias`: metadados da midia propria, com `asset_key`, tipo, origem, autor, licenca, versao e revisao.
- `atividades`: prescricao do paciente. Guarda `exercicio_id`, `instrucoes_execucao`, `imagem_tipo` e mantem `imagem_url` apenas como legado tecnico, sempre nulo para novas prescricoes.

Migrations relevantes:
- `1780600000000-AddAtividadeExerciseImageFields`
- `1780700000000-CreateExerciseCatalog`
- `1780800000000-NormalizeExerciseImageFields`

Regras atuais:
- `imagemTipo` em atividade e `imagemKey` em exercicio aceitam somente chaves proprias conhecidas.
- `imagem_url` legado e limpo pela migration `178080`.
- o banco tem constraints para impedir chaves de imagem desconhecidas.
- a IA nao pode retornar URL de imagem; ela retorna apenas `imagemTipo`.
- a sugestao de IA tenta casar o rascunho com um exercicio aprovado do catalogo.

Chaves permitidas:
- `MOBILIDADE_GERAL`
- `MOBILIDADE_LOMBAR`
- `CONTROLE_CERVICAL`
- `OMBRO_MANGUITO`
- `JOELHO_AGACHAMENTO`
- `QUADRIL_GLUTEOS`
- `TORNOZELO_EQUILIBRIO`
- `PUNHO_PREENSAO`

### Mobile

Componente visual:
- `ExerciseVisual` renderiza ilustracoes locais por `imagemTipo`.
- nao renderiza URL remota;
- mostra marca d'agua discreta `Synap`;
- e usado no fluxo do profissional e do paciente.

Telas contempladas:
- prescricao profissional: selecao pelo catalogo e pre-visualizacao da ilustracao;
- tela do paciente: atividades do dia e atividades sem dia semanal;
- check-in do paciente: imagem e instrucoes de execucao;
- adesao do profissional: imagem, instrucao e ultimo check-in por atividade;
- admin: gestao do catalogo de exercicios.

## Fluxo operacional

1. Admin cadastra ou revisa um exercicio no catalogo.
2. Admin escolhe uma `imagemKey` propria entre as chaves permitidas.
3. Profissional seleciona o exercicio no catalogo ao prescrever.
4. A prescricao herda titulo, descricao, instrucoes e `imagemTipo`.
5. Paciente visualiza a mesma ilustracao e o passo a passo.
6. Check-ins e tela de adesao preservam a mesma referencia visual.

## Governanca

Status do exercicio:
- `RASCUNHO`: disponivel para manutencao admin, nao aparece para prescricao.
- `APROVADO`: disponivel para prescricao e sugestao.
- `ARQUIVADO`: removido da prescricao e da sugestao, preservado para historico/admin.

Midias:
- `sourceType`: `PROPRIA`
- `author`: `Synap`
- `license`: `PROPRIETARIA_SYNAP`
- `attributionText`: `Ilustracao propria Synap.`

## O que nao fazer

- Nao colar URL de imagem externa na prescricao.
- Nao usar imagem com logo/marca de outro site.
- Nao depender de IA para gerar imagem em toda prescricao.
- Nao adicionar nova chave visual sem atualizar backend, mobile, seed/migration e testes.

## Como adicionar uma nova imagem propria

1. Criar a ilustracao no padrao visual Synap.
2. Adicionar a chave em `ExerciseImageType` no backend.
3. Adicionar a opcao equivalente em `EXERCISE_IMAGE_OPTIONS` no mobile.
4. Implementar o desenho no `ExerciseVisual` ou apontar para asset proprio versionado.
5. Atualizar seed/migration se for exercicio inicial.
6. Adicionar ou atualizar teste de validacao.
7. Rodar:
   - backend `npm run lint:ci`
   - backend `npm run build`
   - backend testes de atividades/catalogo
   - mobile `npm run validate:critical`

## Validacoes ja executadas nesta etapa

- backend lint, build e testes focados;
- mobile validate critical;
- migration run no banco de desenvolvimento;
- health check do backend local;
- push da branch `etapa-34-imagem-exercicio`.
