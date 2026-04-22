# QA Assistido - Cenario B (Lombar com componente neural / Crossfit)

Tempo estimado: 12-18 min.

## 1) Preparacao
- Entrar com conta de profissional.
- Garantir paciente vinculado (ex.: `QA Lombar Neural B`).
- Abrir `Anamnese` do paciente.

## 2) Preencher anamnese (dados minimos)
- Tipo de dor: neuropatica ou mista com componente neural.
- Inicio do problema: apos evento.
- Mecanismo de lesao: misto (trauma/sobrecarga).
- Fator de alivio: deitado com joelhos flexionados.
- Fatores de piora: flexao, carga axial, sentado prolongado.
- Historico esportivo: crossfit 4x/semana.
- Lesoes previas: lombalgia recorrente.
- Uso de medicamentos: analgesico eventual.

Resultado esperado:
- Salva sem erro.
- Campos clinicos novos persistem ao reabrir.

## 3) Abrir exame fisico
- Ir para `Exame fisico`.
- No bloco de regioes, aplicar atalho `Coluna`.

Resultado esperado:
- Regioes cervical/toracica/lombar/sacroiliaca em protocolo.
- Progresso de testes atualizado.

## 4) Marcar testes principais
- Regiao lombar:
  - Lasègue (SLR): Positivo
  - Slump test: Positivo
  - Schober: Negativo
- Regiao sacroiliaca:
  - FABER: Negativo
- Tipo de lesao: Neural.

## 5) Validacao neurologica obrigatoria
- Tentar salvar com bloco neurologico detalhado vazio.

Resultado esperado:
- Sistema bloqueia salvamento e mostra erro de neurologico detalhado.

- Preencher ao menos 1 campo neurologico (ex.: sensibilidade alterada em dermatomo L5).
- Salvar novamente.

Resultado esperado:
- Sistema permite salvar.

## 6) Raciocinio e conduta
- Conferir blocos:
  - Raciocinio clinico
  - Diagnostico funcional
  - Conduta direcionada

Resultado esperado:
- Texto sugere componente neural com base nos testes positivos.
- Conduta sugere progressao conservadora e criterio objetivo de reavaliacao.

## 7) Gerar laudo/plano
- Gerar/atualizar laudo.

Resultado esperado:
- Condutas e plano por fases com evidencia clinica dos achados.
- Sem texto excessivamente generico.

## 8) Checklist de aceite final
- [ ] Anamnese salva com campos novos
- [ ] Bloqueio neural funcionou com neurologico vazio
- [ ] Exame salvo apos neurologico preenchido
- [ ] Laudo coerente com lombar neural
