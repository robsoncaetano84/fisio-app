# QA Assistido - Cenario A (Joelho / Futebol)

Tempo estimado: 10-15 min.

## 1) Preparacao
- Entrar com conta de profissional.
- Garantir paciente de teste vinculado (ex.: `QA Joelho A`).
- Abrir `Anamnese` do paciente.

## 2) Preencher anamnese (dados minimos)
- Tipo de dor: mecanica.
- Inicio do problema: gradual.
- Mecanismo de lesao: sobrecarga.
- Fator de alivio: "repouso relativo e gelo".
- Fatores de piora: "corrida, salto e escada".
- Historico esportivo: "futebol recreativo 3x/semana".
- Lesoes previas: "entorse pregressa de tornozelo D".
- Uso de medicamentos: "anti-inflamatorio eventual".

Resultado esperado:
- Salva sem erro.
- Ao reabrir, todos os campos persistem.

## 3) Abrir exame fisico
- Navegar para `Exame fisico`.
- No bloco `Avaliacao por regioes`, usar atalho `Membro inferior`.

Resultado esperado:
- Testes das regioes `Quadril`, `Joelho` e `Tornozelo e pe` ficam em protocolo.
- Barra de progresso mostra total/pendentes.

## 4) Marcar testes principais
- Joelho:
  - Lachman: Negativo
  - Estresse em valgo: Positivo
  - McMurray: Negativo
- Quadril:
  - Trendelenburg: Positivo

Resultado esperado:
- Sistema permite salvar (ha testes positivos/negativos).
- Nao exibe erro de validacao de testes regionais.

## 5) Raciocinio e conduta
- Conferir blocos:
  - Raciocinio clinico
  - Diagnostico funcional
  - Conduta direcionada

Resultado esperado:
- Texto referencia cadeia de membro inferior/controle dinamico.
- Conduta menciona progressao por fase com criterio objetivo.

## 6) Gerar laudo/plano
- Salvar exame fisico.
- Gerar/atualizar laudo.

Resultado esperado:
- `Diagnostico funcional` e `Condutas` sem texto generico.
- Conduta relaciona achados clinicos (testes e deficits funcionais).

## 7) Checklist de aceite final
- [ ] Anamnese completa e persistida
- [ ] Exame fisico salvo com testes regionais validos
- [ ] Raciocinio clinico coerente com joelho/controle motor
- [ ] Laudo com conduta baseada em evidencia clinica
