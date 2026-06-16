# Etapa 34 - Revisao clinica das imagens

## Objetivo

Este documento organiza a revisao clinica das 18 imagens proprias de exercicios do Synap.
A revisao deve ser feita por profissional habilitado antes de liberar o conjunto para uso amplo com pacientes.

Status atual: `PENDENTE_REVISAO_CLINICA`.

Esta matriz nao substitui avaliacao profissional. Codex valida consistencia tecnica de arquivos, contratos e mapeamento, mas nao assina adequacao clinica do movimento.

## Como revisar

1. Abrir a galeria local: `docs/etapa-34-galeria-revisao-imagens.html`.
2. Conferir imagem, nome do exercicio, instrucoes padrao e objetivo esperado.
3. Marcar cada item como:
   - `APROVADA`: movimento claro, seguro e coerente com a prescricao;
   - `REGENERAR_IMAGEM`: imagem ambigua, postura errada, angulo inadequado ou movimento pouco claro;
   - `AJUSTAR_TEXTO`: imagem adequada, mas texto/instrucao precisa mudar;
   - `REMOVER_DO_CATALOGO`: exercicio nao deve seguir para prescricao neste momento.
4. Se houver ambiguidade, regenerar apenas a imagem afetada, mantendo slug e chave.
5. Depois de aprovada, registrar profissional, data, observacao e versao revisada.
6. No admin do catalogo, abrir o exercicio e atualizar a revisao clinica da imagem principal.

## Criterios de aceite

- Movimento representado corresponde ao nome e as instrucoes padrao.
- Posicao inicial e direcao do movimento sao compreensiveis para profissional e paciente.
- Imagem nao incentiva compensacao insegura, amplitude excessiva ou postura inadequada.
- Regiao alvo e contexto corporal estao claros.
- Identidade visual segue a matriz anatomica do projeto: escala de cinza, fundo claro e destaque verde Synap.
- Arquivo nao contem texto, logo externo, marca de terceiros ou marca d'agua embutida.
- Caso a imagem use uma vista diferente da matriz posterior, a escolha deve ajudar a compreensao do movimento.

## Registro da revisao

- Profissional:
- Registro profissional:
- Data:
- Ambiente revisado:
- Versao do app/branch: `etapa-34-imagem-exercicio`
- Parecer geral: `PENDENTE`
- Observacoes gerais:

## Matriz de revisao

| # | Exercicio | Chave | Asset | O que validar | Status | Observacoes |
|---|---|---|---|---|---|---|
| 1 | Mobilidade lombar em gato-camelo | `MOBILIDADE_LOMBAR_GATO_CAMELO` | `apps/mobile/assets/exercises/mobilidade-lombar-gato-camelo.jpg` | Quatro apoios, alternancia de flexao/extensao da coluna, movimento suave sem amplitude forcada. | `PENDENTE` | |
| 2 | Ponte curta | `PONTE_CURTA` | `apps/mobile/assets/exercises/ponte-curta.jpg` | Decubito dorsal, joelhos flexionados, elevacao curta do quadril sem hiperextensao lombar. | `PENDENTE` | |
| 3 | Controle cervical profundo | `CONTROLE_CERVICAL_PROFUNDO` | `apps/mobile/assets/exercises/controle-cervical-profundo.jpg` | Recolhimento leve do queixo, baixa amplitude, ombros relaxados, sem flexao cervical exagerada. | `PENDENTE` | |
| 4 | Elevacao assistida de ombro | `ELEVACAO_ASSISTIDA_OMBRO` | `apps/mobile/assets/exercises/elevacao-assistida-ombro.jpg` | Elevacao do braco com apoio, amplitude toleravel, escapula controlada, sem ombro elevado para a orelha. | `PENDENTE` | |
| 5 | Agachamento parcial assistido | `AGACHAMENTO_PARCIAL_ASSISTIDO` | `apps/mobile/assets/exercises/agachamento-parcial-assistido.jpg` | Agachamento curto com apoio seguro, joelhos alinhados aos pes, tronco controlado. | `PENDENTE` | |
| 6 | Abducao de quadril em decubito lateral | `ABDUCAO_QUADRIL_DECUBITO_LATERAL` | `apps/mobile/assets/exercises/abducao-quadril-decubito-lateral.jpg` | Decubito lateral, elevacao da perna superior, pelve estavel, sem rotacao posterior do quadril. | `PENDENTE` | |
| 7 | Equilibrio bipodal com transferencia de peso | `EQUILIBRIO_BIPODAL_TRANSFERENCIA_PESO` | `apps/mobile/assets/exercises/equilibrio-bipodal-transferencia-peso.jpg` | Apoio bipodal, transferencia lenta de peso, apoio de seguranca proximo e postura alinhada. | `PENDENTE` | |
| 8 | Preensao manual com bola macia | `PREENSAO_MANUAL_BOLA_MACIA` | `apps/mobile/assets/exercises/preensao-manual-bola-macia.jpg` | Bola na palma da mao, punho neutro, aperto gradual e relaxamento sem tensao proximal excessiva. | `PENDENTE` | |
| 9 | Mobilidade toracica em rotacao sentada | `MOBILIDADE_TORACICA_ROTACAO_SENTADA` | `apps/mobile/assets/exercises/mobilidade-toracica-rotacao-sentada.jpg` | Sedestacao, rotacao controlada do tronco, pelve estavel e amplitude confortavel. | `PENDENTE` | |
| 10 | Retracao escapular sentada | `RETRACAO_ESCAPULAR_SENTADA` | `apps/mobile/assets/exercises/retracao-escapular-sentada.jpg` | Escapulas para tras e para baixo, ombros relaxados, sem elevacao compensatoria. | `PENDENTE` | |
| 11 | Isometria de rotacao externa de ombro | `ISOMETRIA_ROTACAO_EXTERNA_OMBRO` | `apps/mobile/assets/exercises/isometria-rotacao-externa-ombro.jpg` | Cotovelo a 90 graus junto ao corpo, dorso da mao pressionando apoio, sem rotacao do tronco. | `PENDENTE` | |
| 12 | Extensao de joelho sentado | `EXTENSAO_JOELHO_SENTADO` | `apps/mobile/assets/exercises/extensao-joelho-sentado.jpg` | Sedestacao, extensao controlada do joelho, tronco alinhado, sem balanco rapido da perna. | `PENDENTE` | |
| 13 | Sentar e levantar controlado | `SENTAR_LEVANTAR_CONTROLADO` | `apps/mobile/assets/exercises/sentar-levantar-controlado.jpg` | Transferencia da cadeira, inclinacao leve do tronco, joelhos alinhados, descida controlada. | `PENDENTE` | |
| 14 | Alongamento de flexores de quadril em meio ajoelhado | `ALONGAMENTO_FLEXORES_QUADRIL_MEIO_AJOELHADO` | `apps/mobile/assets/exercises/alongamento-flexores-quadril-meio-ajoelhado.jpg` | Meio ajoelhado, retroversao leve da pelve, tronco alinhado, sem hiperextensao lombar. | `PENDENTE` | |
| 15 | Marcha estacionaria com apoio | `MARCHA_ESTACIONARIA_APOIO` | `apps/mobile/assets/exercises/marcha-estacionaria-apoio.jpg` | Apoio seguro proximo, elevacao alternada dos pes, postura alinhada e amplitude pequena. | `PENDENTE` | |
| 16 | Mobilidade de punho em flexao e extensao | `MOBILIDADE_PUNHO_FLEXAO_EXTENSAO` | `apps/mobile/assets/exercises/mobilidade-punho-flexao-extensao.jpg` | Antebraco apoiado, mao livre, flexao/extensao ativa do punho sem amplitude forcada. | `PENDENTE` | |
| 17 | Alongamento cervical lateral assistido | `ALONGAMENTO_CERVICAL_LATERAL_ASSISTIDO` | `apps/mobile/assets/exercises/alongamento-cervical-lateral-assistido.jpg` | Inclinacao lateral suave, mao apenas como apoio leve, sem tracao forte ou rotacao cervical. | `PENDENTE` | |
| 18 | Deslizamento neural mediano | `DESLIZAMENTO_NEURAL_MEDIANO` | `apps/mobile/assets/exercises/deslizamento-neural-mediano.jpg` | Membro superior em deslizamento neural leve, sem postura de tensao maxima sustentada. | `PENDENTE` | |

## Decisao por item

Preencher uma linha por imagem revisada.

| # | Decisao | Responsavel | Data | Acao necessaria |
|---|---|---|---|---|
| 1 | `PENDENTE` | | | |
| 2 | `PENDENTE` | | | |
| 3 | `PENDENTE` | | | |
| 4 | `PENDENTE` | | | |
| 5 | `PENDENTE` | | | |
| 6 | `PENDENTE` | | | |
| 7 | `PENDENTE` | | | |
| 8 | `PENDENTE` | | | |
| 9 | `PENDENTE` | | | |
| 10 | `PENDENTE` | | | |
| 11 | `PENDENTE` | | | |
| 12 | `PENDENTE` | | | |
| 13 | `PENDENTE` | | | |
| 14 | `PENDENTE` | | | |
| 15 | `PENDENTE` | | | |
| 16 | `PENDENTE` | | | |
| 17 | `PENDENTE` | | | |
| 18 | `PENDENTE` | | | |

## Registro no sistema

A decisao de cada imagem deve ser registrada no admin do catalogo. O backend grava essa decisao na midia principal do exercicio:

- `PENDENTE`: ainda nao revisada;
- `APROVADA`: imagem clinicamente aceita;
- `REGENERAR_IMAGEM`: precisa refazer o JPG;
- `AJUSTAR_TEXTO`: imagem aceita, texto precisa ajuste;
- `REMOVER_DO_CATALOGO`: retirar do fluxo de prescricao.

O registro tecnico fica em `exercicio_midias`, separado do status operacional do exercicio. Isso evita confundir um exercicio `APROVADO` para manutencao/catalogo com uma imagem ainda pendente de revisao clinica.

## Quando regenerar uma imagem

Regenerar somente o asset afetado quando:
- o angulo nao permite entender o movimento;
- a postura induz execucao insegura;
- o movimento parece diferente do nome/instrucao;
- a imagem fica estetica demais e pouco instrucional;
- a regiao alvo nao e reconhecivel;
- existe elemento visual que pareca equipamento obrigatorio quando nao e.

Ao regenerar:
1. manter o mesmo slug e a mesma `imagemKey`;
2. substituir apenas o JPG correspondente;
3. manter o padrao visual Synap;
4. rodar `npm run check:exercise-assets` no mobile;
5. rodar `npm run validate:critical` no mobile;
6. registrar a nova decisao nesta matriz.

## Expansao futura do catalogo

Todo novo exercicio com imagem propria deve seguir o mesmo fluxo:

1. Criar o exercicio como `RASCUNHO`.
2. Criar a chave no backend em `ExerciseImageType`.
3. Adicionar a chave nas constraints por migration.
4. Criar o asset JPG em `apps/mobile/assets/exercises`.
5. Mapear o asset em `ExerciseVisual`.
6. Adicionar a opcao em `EXERCISE_IMAGE_OPTIONS`.
7. Criar seed/migration quando o exercicio fizer parte do catalogo base.
8. Atualizar testes de contrato e assets.
9. Revisar clinicamente a imagem e o texto.
10. Aprovar o exercicio somente apos revisao clinica registrada.
