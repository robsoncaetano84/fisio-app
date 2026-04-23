# Release Runbook - Sprint 5 Metrics (Clinical Orchestrator)

## Scope
- Clinical metrics filters by:
  - `professionalId`
  - `patientId`
  - `status` (`NOVO_PACIENTE`, `AGUARDANDO_VINCULO`, `ANAMNESE_PENDENTE`, `EM_TRATAMENTO`, `ALTA`)
- Applied to endpoints:
  - `GET /metrics/clinical-flow/summary`
  - `GET /metrics/clinical-flow/check-engagement-summary`
  - `GET /metrics/clinical-flow/physical-exam-tests-summary`
  - `GET /crm/clinical/dashboard-summary`
- CRM Admin web updated with status filter chips and clickable pipeline cards.
- DB index migration added:
  - `1779100000000-AddClinicalFlowFilterIndexes`

## Candidate commit
- Branch: `epic/clinical-orchestrator`
- Commit: `254b4fe`

## Pre-deploy checks (local)
```bash
# backend
cd apps/backend
npm run -s build
npm run test -- modules/metrics/metrics.service.spec.ts

# mobile
cd ../mobile
npm run validate:critical
```

## Deploy order
1. Backend deploy first.
2. Run backend migration.
3. Validate API responses.
4. Frontend deploy.
5. Validate CRM dashboard filters.

## Render - backend migration
From backend shell:
```bash
cd /opt/render/project/src/apps/backend
npm run migration:run
```

Expected:
- migration `1779100000000-AddClinicalFlowFilterIndexes` must be marked as executed.

Optional verification:
```bash
npm run migration:show
```

## API smoke test (production)
Use a valid ADMIN JWT for CRM endpoints.

### 1) Dashboard summary with filters
```bash
curl -s "https://fisio-backend-pax6.onrender.com/api/crm/clinical/dashboard-summary?windowDays=30&semEvolucaoDias=10&professionalId=<PROF_ID>&status=EM_TRATAMENTO" \
  -H "Authorization: Bearer <ADMIN_JWT>"
```

Check:
- HTTP `200`
- response includes:
  - `pipeline`
  - `alertas`
  - `metricas`
  - `filtros.status = "EM_TRATAMENTO"`

### 2) Clinical flow summary with filters
```bash
curl -s "https://fisio-backend-pax6.onrender.com/api/metrics/clinical-flow/summary?windowDays=30&professionalId=<PROF_ID>&patientId=<PAC_ID>&status=COMPLETED&stage=EVOLUCAO" \
  -H "Authorization: Bearer <ADMIN_JWT>"
```

Check:
- HTTP `200`
- `filters` object present
- no server error

### 3) Check engagement summary with status
```bash
curl -s "https://fisio-backend-pax6.onrender.com/api/metrics/clinical-flow/check-engagement-summary?windowDays=30&professionalId=<PROF_ID>&status=EM_TRATAMENTO" \
  -H "Authorization: Bearer <ADMIN_JWT>"
```

Check:
- HTTP `200`
- fields: `checkClicks`, `checkinsSubmitted`, `conversionRate`, `filters`

### 4) Physical exam tests summary with status
```bash
curl -s "https://fisio-backend-pax6.onrender.com/api/metrics/clinical-flow/physical-exam-tests-summary?windowDays=30&professionalId=<PROF_ID>&status=EM_TRATAMENTO" \
  -H "Authorization: Bearer <ADMIN_JWT>"
```

Check:
- HTTP `200`
- fields: `laudosAnalisados`, `porRegiao`, `topTestesPositivos`, `filters`

## CRM web validation
1. Open Admin CRM.
2. In global filters, change `Status clinico` chips.
3. Confirm KPI and cards refresh after filter change.
4. Click pipeline cards:
   - New patient
   - Waiting link
   - Pending anamnesis
   - In treatment
   - Discharge
5. Confirm the selected chip and loaded data remain consistent.

## Go / No-Go for this package
## GO
- backend migration executed
- all 4 API smoke tests return `200`
- no recurring `5xx` on metrics endpoints for 30 min
- CRM admin filters update data consistently

## NO-GO
- migration fails
- API returns `5xx` or invalid payload shape
- filter changes do not affect returned dataset

## Rollback
1. Revert backend to previous stable commit.
2. Revert frontend to previous stable commit.
3. Keep DB indexes (safe additive migration).
4. Re-open incident with endpoint + query used and timestamp.
