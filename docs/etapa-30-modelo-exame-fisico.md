# Etapa 30 - Modelo de Exame Fisico

## Escopo

- Estruturar avaliacao postural dentro do Exame Fisico.
- Registrar plano frontal, plano sagital e Teste de Adams.
- Integrar achados posturais ao texto salvo do exame fisico.
- Usar esses achados como evidencia para laudo, plano, criterios de progressao e reavaliacao.

Fotos clinicas nao fazem parte do Exame Fisico nesta etapa. Captura, analise e comparacao de fotos permanecem fora deste fluxo.

## Campos implementados

- Plano frontal:
  - cabeca
  - ombros
  - escapulas
  - pelve
  - joelhos
  - pes/apoio

- Plano sagital:
  - cabeca
  - cifose toracica
  - lordose lombar
  - pelve
  - joelhos
  - apoio plantar

- Teste de Adams:
  - resultado
  - regiao
  - intensidade
  - ATR/escoliometro em graus
  - descricao clinica complementar

## Regras de validacao

- O bloco postural nao e obrigatorio quando nao for aplicavel.
- Se o Adams indicar assimetria, intensidade moderada/importante ou ATR maior ou igual a 5 graus, a regiao do achado deve ser informada.
- ATR preenchido deve ser numerico e maior ou igual a 0.
- ATR maior ou igual a 5 graus exige descricao clinica do achado no Adams.
- Valores como `Nao avaliado` nao devem entrar como evidencia clinica no backend.

## Integracao com laudo e plano

- O resumo do exame fisico prioriza linhas de plano frontal, plano sagital, Adams, ATR e alertas clinicos.
- Quando houver Adams relevante, o plano deve incluir reavaliacao objetiva antes de aumentar carga, complexidade ou retorno funcional.
- O laudo deve tratar achado postural como correlacao clinica, nao como diagnostico automatico.

## QA manual

1. Abrir Exame Fisico com anamnese existente.
2. Selecionar Adams alterado sem regiao e tentar validar: deve bloquear.
3. Informar regiao e ATR invalido: deve bloquear.
4. Informar ATR `5` ou maior sem descricao do Adams: deve bloquear.
5. Preencher descricao do Adams, validar e salvar: deve salvar.
6. Reabrir o exame: os chips e a descricao devem permanecer.
7. Gerar laudo/plano: achados posturais relevantes devem aparecer como evidencia e criterio de reavaliacao.
