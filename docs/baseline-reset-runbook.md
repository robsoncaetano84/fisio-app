# Baseline reset do schema — runbook

## Contexto (por que fazer)

O banco Supabase foi construído por uma **linhagem de migrations diferente** (etapa-35/37)
da que o **código roda** (comunidade + etapa-38). Rodar `migration:run` cru tentaria aplicar
migrations do código que já não fazem sentido no schema atual → conflito. Isso também é por que
o login quebrou (a coluna `token_version` da etapa-38 nunca foi aplicada aqui).

**Diagnóstico (medido):** o ledger `public.migrations` tem 50 registros; o código tem 38
migrations; **32 já coincidem**. Só **6 divergem**, e **5 já têm o efeito no banco**:

| Migration (código, ausente do ledger) | Efeito no banco? |
| --- | --- |
| `CreateExerciciosCatalog` | ✅ presente (catálogo em uso) |
| `AddAtividadeExerciseFields` | ✅ presente (`atividades.exercicio_id`) |
| `CreateLaudoHistorico` (F6) | ✅ presente (criada no hotfix) |
| `AddUsuarioTokenVersion` (F9) | ✅ presente (criada no hotfix) |
| `PacienteCpfUniquePorProfissional` (F16) | ✅ presente (índice CPF já existe) |
| `AddUniqueLaudoPaciente` (F7) | ❌ **ausente** (índice único de laudo não aplicado) |

## Objetivo

**Adotar o schema atual do banco como baseline**: marcar as 6 migrations do código como
"aplicadas" no ledger, para que `migration:run` vire **no-op** e só rode migrations **novas**
daqui pra frente. **Nenhuma DDL é executada** — só inserções no ledger (reversível).

## ⚠️ Regras de segurança (DBA)

1. **Nunca** `synchronize: true` neste banco (a auditoria mostrou que dropava 17 colunas + FKs).
2. **Backup/snapshot antes** (Supabase → Database → Backups / PITR).
3. **Teste num clone primeiro** (ver abaixo). Só depois aplique em produção.
4. `DB_MIGRATIONS_RUN` só deve ir para `true` **depois** deste baseline.

## Passo a passo

### 0. Backup
No painel Supabase: faça um snapshot/backup do banco (ou confirme que o PITR está ativo).

### 1. (Recomendado) Clonar prod para um Supabase de dev
- Crie um projeto Supabase de dev.
- Restaure/importe o schema+dados do prod nele (pg_dump/pg_restore, ou snapshot).
- Aponte um `.env` de teste para o clone (`DB_HOST` do dev).

### 2. Dry-run (read-only) no alvo
```bash
cd apps/backend
npm run build
node scripts/baseline-reconciliar-migrations.mjs
```
Deve listar as ~6 migrations ausentes do ledger. Não altera nada.

### 3. Aplicar o baseline (marca como aplicadas)
```bash
node scripts/baseline-reconciliar-migrations.mjs --apply
```
Isso insere as 6 no `public.migrations`. Reversível:
`DELETE FROM public.migrations WHERE name IN (...as inseridas...)`.

### 4. Verificar
```bash
node scripts/checar-schema-aditivo.mjs   # deve seguir "nada aditivo faltando"
```
E confirme o app (login, catálogo). No clone, você também pode rodar `migration:run` e ver
que é no-op.

### 5. Repetir 2–4 em produção (após validar no clone)

## Decisão do F7 (`AddUniqueLaudoPaciente`) — resolver à parte

O índice único `UQ_LAUDO_PACIENTE_ID` (um laudo por paciente) **não existe** no banco. Marcar a
migration como aplicada só diz "não tente rodar de novo" — **não** cria o índice. Decida:

- **Quer um laudo por paciente?** Verifique duplicatas e crie o índice deliberadamente:
  ```sql
  -- checar duplicatas primeiro:
  SELECT paciente_id, count(*) FROM laudos GROUP BY paciente_id HAVING count(*) > 1;
  -- se zero, criar:
  CREATE UNIQUE INDEX IF NOT EXISTS "UQ_LAUDO_PACIENTE_ID" ON "laudos" ("paciente_id");
  ```
- **Não quer essa regra?** Remova o índice único do `laudo.entity.ts` (e a migration F7).

Enquanto não decidir, o `checar-schema-aditivo` continuará listando o F7 como "índice UNIQUE
para revisar" — é o lembrete correto.

## Daqui pra frente (fluxo padrão)

- Toda mudança de schema = **nova migration** (em cima do baseline), revisada em PR.
- Rodar migrations em **staging/clone** antes de prod; backup antes de prod.
- CI/pré-deploy: `npm run schema:check` (falha se faltar tabela/coluna).
- Ideal: **Supabase de dev separado** para não testar contra dados reais.
