# QA Guiado - Etapa 23 (cenários esportivos)

Objetivo: validar ponta a ponta `anamnese -> exame físico -> laudo/conduta IA` em 3 perfis reais.

## Pré-requisitos
- Backend local ativo (`apps/backend`) com banco atualizado.
- Front web local ativo (`apps/mobile` com `npm run web`).
- 1 profissional de teste autenticado.
- Paciente vinculado ao profissional para cada cenário.

## Convenções de aceite
- A anamnese deve salvar sem erro e persistir os campos clínicos novos:
  - `inicioProblema`, `mecanismoLesao`, `fatorAlivio`, `fatoresPiora`,
  - `historicoEsportivo`, `lesoesPrevias`, `usoMedicamentos`.
- Exame físico deve impedir salvar sem ao menos 1 teste regional `Positivo` ou `Negativo`.
- Se `tipoLesao` incluir `Neural`, exigir preenchimento de neurológico detalhado.
- Laudo/conduta IA deve citar evidência clínica dos achados (não texto genérico).

---

## Cenário A - Joelho (futebol, sobrecarga + instabilidade)

### Massa clínica
- Queixa: dor anterior no joelho D ao correr/saltar.
- Início: gradual.
- Mecanismo: sobrecarga.
- Melhora: repouso relativo e gelo.
- Piora: corrida, salto, escada.
- Histórico esportivo: futebol recreativo 3x/semana.
- Lesões prévias: entorse prévia tornozelo D.
- Medicamentos: anti-inflamatório eventual.

### Exame físico (mínimo esperado)
- Testes funcionais: agachamento unilateral com compensação/valgo.
- Região JOELHO:
  - Lachman: Negativo
  - Estresse em valgo: Positivo
  - McMurray: Negativo
- Região QUADRIL:
  - Trendelenburg: Positivo

### Aceite
- Diagnóstico funcional cita cadeia membro inferior e déficit de controle dinâmico.
- Conduta IA propõe progressão por fases e critério objetivo (ex.: dor <= 3/10 + execução sem valgo dinâmico).

---

## Cenário B - Lombar (crossfit, carga axial + componente neural)

### Massa clínica
- Queixa: dor lombar com irradiação para MI E.
- Início: após evento (levantamento terra).
- Mecanismo: trauma/sobrecarga mista.
- Melhora: deitado com joelhos flexionados.
- Piora: flexão, carga, permanecer sentado.
- Histórico esportivo: crossfit 4x/semana.
- Lesões prévias: lombalgia recorrente.
- Medicamentos: analgésico comum.

### Exame físico (mínimo esperado)
- Região LOMBAR:
  - Lasègue (SLR): Positivo
  - Slump: Positivo
  - Schober: Negativo
- Região SACROILIACA:
  - FABER: Negativo
- Tipo de lesão: Neural.
- Neurológico detalhado: preencher ao menos 1 campo (força/sensibilidade/reflexos/dermátomos/miótomos).

### Aceite
- Sistema bloqueia salvar se `tipoLesao=Neural` e neurológico detalhado vazio.
- Raciocínio clínico sugere componente neural com evidência dos testes.
- Conduta IA orienta progressão conservadora com reavaliação neurológica.

---

## Cenário C - Ombro (voleibol, sobreuso subacromial)

### Massa clínica
- Queixa: dor no ombro D ao sacar.
- Início: insidioso.
- Mecanismo: sobrecarga repetitiva.
- Melhora: redução de volume de treino.
- Piora: elevação acima da cabeça, saque, arremesso.
- Histórico esportivo: voleibol 5x/semana.
- Lesões prévias: sem cirurgia, episódios de tendinite.
- Medicamentos: sem uso contínuo.

### Exame físico (mínimo esperado)
- Região OMBRO:
  - Neer: Positivo
  - Hawkins-Kennedy: Positivo
  - Drop Arm: Negativo
  - Jobe: Positivo
- Teste funcional: controle escapular alterado.

### Aceite
- Estrutura envolvida cita espaço subacromial/manguito com evidência.
- Conduta IA deve incluir progressão esportiva explícita (retorno gradual ao saque).

---

## Checklist de execução (rápido)
- [ ] Cadastro e vínculo do paciente no profissional.
- [ ] Anamnese salva com novos campos obrigatórios por sintoma existente.
- [ ] Exame físico salvo com testes regionais e validações.
- [ ] Laudo gerado com diagnóstico e conduta baseados em evidência.
- [ ] Revisão manual de coerência clínica (profissional).

## Evidências recomendadas
- Print da anamnese salva (campos novos).
- Print do bloco de testes por região com resultados.
- Print de diagnóstico/conduta do laudo.
- Log de eventuais bloqueios esperados (validação neural).
