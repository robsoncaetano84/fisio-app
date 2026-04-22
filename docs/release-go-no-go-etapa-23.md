# Release Decision - Etapa 23 (Go / No-Go)

## Escopo consolidado
- Expansao da anamnese com campos clinicos obrigatorios.
- Exame fisico estruturado por regioes com validacoes.
- Blocos de raciocinio clinico, diagnostico funcional e conduta orientada.
- Refinos de UX para acelerar preenchimento (baterias por perfil/regiao).
- Pacote QA com cenarios A/B/C e matriz de execucao.
- Cobertura automatizada minima para validacao do exame estruturado no backend.

## Criterios de GO (todos obrigatorios)
- [ ] Cenario A aprovado
- [ ] Cenario B aprovado
- [ ] Cenario C aprovado
- [ ] Sem bloqueadores criticos abertos na matriz QA
- [ ] Validacoes tecnicas locais ok:
  - [ ] `apps/mobile`: `npm run validate:critical`
  - [ ] `apps/backend`: `npm run -s build`
  - [ ] `apps/backend`: `npm run test -- modules/laudos/laudos.service.spec.ts`
- [ ] Sem regressao de encoding/i18n detectada
- [ ] Sem erro 5xx recorrente nos endpoints clinicos

## Criterios de NO-GO (qualquer item abaixo)
- [ ] Falha em validacao neural obrigatoria (tipoLesao neural sem neurologico detalhado).
- [ ] Exame fisico permitindo salvar sem teste regional valido.
- [ ] Laudo/plano com conduta sem evidencia clinica minima em casos testados.
- [ ] Erro de persistencia em campos clinicos novos da anamnese.

## Risco residual aceito nesta release
- Dependencia de validacao clinica manual final para consistencia semantica dos textos IA.
- Cobertura automatizada ainda inicial (foco atual em validacao do exame estruturado).

## Plano de rollback
1. Reverter deploy para commit estavel anterior da branch de release.
2. Manter dados clinicos salvos (sem rollback de banco, exceto em migracao quebrada).
3. Reabrir matriz QA com causa raiz e patch corretivo.

## Decisao final
- Status: `PENDENTE` (preencher apos execucao da matriz QA)
- Responsavel:
- Data:
- Commit candidato:
