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
- `1780900000000-AddUniqueExerciseMediaAsset`
- `1781000000000-SeedExpandedExerciseCatalog`
- `1781100000000-ExpandExerciseSpecificImageTypes`

Regras atuais:
- `imagemTipo` em atividade e `imagemKey` em exercicio aceitam somente chaves proprias conhecidas.
- `imagem_url` legado e limpo pela migration `178080`.
- o banco tem constraints para impedir chaves de imagem desconhecidas.
- a IA nao pode retornar URL de imagem; ela retorna apenas `imagemTipo`.
- a sugestao de IA tenta casar o rascunho com um exercicio aprovado do catalogo.
- o catalogo inicial contem 18 exercicios aprovados, incluindo variacoes para cervical, toracica, lombar, ombro, joelho, quadril, tornozelo e punho/mao.
- cada exercicio inicial possui uma chave de imagem especifica, mantendo as chaves genericas apenas para compatibilidade e fallback.

Chaves permitidas:
- `MOBILIDADE_GERAL`
- `MOBILIDADE_LOMBAR`
- `CONTROLE_CERVICAL`
- `OMBRO_MANGUITO`
- `JOELHO_AGACHAMENTO`
- `QUADRIL_GLUTEOS`
- `TORNOZELO_EQUILIBRIO`
- `PUNHO_PREENSAO`
- `MOBILIDADE_LOMBAR_GATO_CAMELO`
- `PONTE_CURTA`
- `CONTROLE_CERVICAL_PROFUNDO`
- `ELEVACAO_ASSISTIDA_OMBRO`
- `AGACHAMENTO_PARCIAL_ASSISTIDO`
- `ABDUCAO_QUADRIL_DECUBITO_LATERAL`
- `EQUILIBRIO_BIPODAL_TRANSFERENCIA_PESO`
- `PREENSAO_MANUAL_BOLA_MACIA`
- `MOBILIDADE_TORACICA_ROTACAO_SENTADA`
- `RETRACAO_ESCAPULAR_SENTADA`
- `ISOMETRIA_ROTACAO_EXTERNA_OMBRO`
- `EXTENSAO_JOELHO_SENTADO`
- `SENTAR_LEVANTAR_CONTROLADO`
- `ALONGAMENTO_FLEXORES_QUADRIL_MEIO_AJOELHADO`
- `MARCHA_ESTACIONARIA_APOIO`
- `MOBILIDADE_PUNHO_FLEXAO_EXTENSAO`
- `ALONGAMENTO_CERVICAL_LATERAL_ASSISTIDO`
- `DESLIZAMENTO_NEURAL_MEDIANO`

### Mobile

Componente visual:
- `ExerciseVisual` renderiza ilustracoes locais por `imagemTipo`.
- nao renderiza URL remota;
- usa JPG proprio otimizado para movimentos especificos gerados a partir da matriz anatomica do projeto;
- mantem SVG local como fallback para tipos genericos ou sem asset raster;
- mostra marca d'agua discreta `Synap` no componente, nao embutida no arquivo;
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

Assets mobile:
- caminho: `apps/mobile/assets/exercises`;
- nome do arquivo em kebab-case, alinhado ao slug do exercicio;
- formato JPG otimizado para reduzir o bundle mobile;
- sem texto, logo ou marca d'agua no arquivo de imagem;
- referencia visual: matriz anatomica masculina do projeto, com escala de cinza, fundo claro e destaque verde Synap.

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

- backend lint, build, `tsc --noEmit`, testes focados e suite completa;
- mobile `validate:critical`;
- mobile `check:exercise-assets` cobrindo 18 assets especificos;
- migration run no banco de desenvolvimento;
- migration show sem pendencias no banco de desenvolvimento;
- health check do backend local;
- push da branch `etapa-34-imagem-exercicio`.

## Expansao do catalogo inicial

A migration `1781000000000-SeedExpandedExerciseCatalog` adiciona 10 exercicios aprovados ao catalogo proprio:
- mobilidade toracica em rotacao sentada;
- retracao escapular sentada;
- isometria de rotacao externa de ombro;
- extensao de joelho sentado;
- sentar e levantar controlado;
- alongamento de flexores de quadril em meio ajoelhado;
- marcha estacionaria com apoio;
- mobilidade de punho em flexao e extensao;
- alongamento cervical lateral assistido;
- deslizamento neural mediano.

A migration `1781100000000-ExpandExerciseSpecificImageTypes` amplia as constraints de `imagem_tipo`/`imagem_key` e atualiza os 18 exercicios iniciais para chaves especificas por exercicio. Prescricoes existentes vinculadas a esses exercicios tambem recebem a chave especifica correspondente.
