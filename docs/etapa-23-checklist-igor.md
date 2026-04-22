# Etapa 23 - Checklist técnico (solicitações do Igor)

## 1) Anamnese
- [x] Início da dor (agudo/insidioso/evento): `inicioProblema`
- [x] Mecanismo de lesão (trauma/sobrecarga/misto): `mecanismoLesao`
- [x] Fatores de melhora/alívio: `fatorAlivio`
- [x] Fatores de piora/agravo: `fatoresPiora`
- [x] Histórico esportivo: `historicoEsportivo`
- [x] Lesões prévias: `lesoesPrevias`
- [x] Uso de medicamentos: `usoMedicamentos`
- [x] Validação frontend + backend para sintomas existentes (campos obrigatórios)

## 2) Exame físico - inspeção, palpação e movimento
- [x] Inspeção: postura, assimetria, edema, atrofia muscular, marcha
- [x] Palpação: pontos dolorosos, temperatura, tônus, trigger points, estruturas
- [x] Hipomobilidade articular segmentar:
  - [x] Cervical (C1-C7)
  - [x] Torácica (T1-T12)
  - [x] Lombar (L1-L5)
  - [x] Sacro
  - [x] Ilíaco D
  - [x] Ilíaco E
- [x] Movimento: ADM ativa/passiva, qualidade, compensações, dor no movimento

## 3) Testes funcionais (esportivo)
- [x] Agachamento
- [x] Agachamento unilateral
- [x] Salto
- [x] Corrida
- [x] Estabilidade
- [x] Controle motor

## 4) Avaliação por regiões (positivo/negativo)
- [x] Coluna cervical (Sharp Purser, Dekleyn, Spurling, etc.)
- [x] Coluna torácica
- [x] Coluna lombar
- [x] Sacroilíaca
- [x] Quadril
- [x] Joelho
- [x] Tornozelo e pé
- [x] Ombro
- [x] Cotovelo
- [x] Punho e mão
- [x] Resultado por teste: `N/T`, `Negativo`, `Positivo`
- [x] Validação mínima: ao menos um teste regional marcado positivo/negativo

## 5) Raciocínio clínico (IA + estrutura)
- [x] Origem provável da dor
- [x] Estrutura envolvida
- [x] Tipo de lesão (mecânica/inflamatória/neural)
- [x] Fator biomecânico associado
- [x] Relação com esporte
- [x] Melhoria da síntese com sinais regionais + tipo de lesão + red flags

## 6) Diagnóstico funcional (IA)
- [x] Disfunção principal
- [x] Cadeia envolvida
- [x] Compensações

## 7) Conduta (IA direcionada)
- [x] Técnica manual indicada
- [x] Ajuste articular
- [x] Exercício corretivo
- [x] Liberação miofascial
- [x] Progressão esportiva
- [x] Prompt reforçado para justificar condutas com evidência clínica

## 8) UX acelerada (implementado)
- [x] Status de pendência por região (`X não testado(s)`)
- [x] Destaque visual de regiões sem testes concluídos
- [x] Atalhos de bateria de testes por perfil:
  - [x] Coluna
  - [x] Membro inferior
  - [x] Membro superior
  - [x] Esportivo
- [x] Atalho por região: `Bateria básica`

## Pendências recomendadas (próximo lote)
- [ ] Teste QA guiado ponta a ponta com 3 cenários esportivos reais (joelho, lombar, ombro)
- [ ] Ajustar microcópias clínicas finais em todos os blocos para linguagem 100% padronizada
- [x] Cobertura automatizada mínima para serialização/parsing do exame estruturado

## Atualização deste lote
- [x] i18n do fluxo clínico no detalhe do paciente (Resumo de prontidão + status por etapa)
- [x] i18n de microcópias críticas no Exame Físico (ações e títulos de bloco)
- [x] i18n de alerta de geração de PDF no Laudo
- [x] Datas do Laudo agora respeitam locale ativo (pt/en/es)
