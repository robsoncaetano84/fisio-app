-- Repara o ledger de migrations quando objetos já existem no banco
-- e não estão registrados na tabela "migrations".

INSERT INTO migrations(timestamp, name)
SELECT 1778200000000, 'CreatePatientCheckClickEvents1778200000000'
WHERE EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'patient_check_click_events'
)
AND NOT EXISTS (
  SELECT 1 FROM migrations WHERE timestamp = 1778200000000
);

INSERT INTO migrations(timestamp, name)
SELECT 1778300000000, 'CreateCrmAdminAuditLogs1778300000000'
WHERE EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'crm_admin_audit_logs'
)
AND NOT EXISTS (
  SELECT 1 FROM migrations WHERE timestamp = 1778300000000
);

INSERT INTO migrations(timestamp, name)
SELECT 1778400000000, 'AddAnamneseClinicalExtensions1778400000000'
WHERE EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'anamneses'
    AND column_name = 'mecanismo_lesao'
)
AND EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'anamneses'
    AND column_name = 'fatores_piora'
)
AND EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'anamneses'
    AND column_name = 'historico_esportivo'
)
AND EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'anamneses'
    AND column_name = 'lesoes_previas'
)
AND EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'anamneses'
    AND column_name = 'uso_medicamentos'
)
AND NOT EXISTS (
  SELECT 1 FROM migrations WHERE timestamp = 1778400000000
);

INSERT INTO migrations(timestamp, name)
SELECT 1778500000000, 'AddLaudoSuggestionMetadata1778500000000'
WHERE EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'laudos'
    AND column_name = 'sugestao_source'
)
AND EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'laudos'
    AND column_name = 'exames_considerados'
)
AND EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'laudos'
    AND column_name = 'exames_com_leitura_ia'
)
AND EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'laudos'
    AND column_name = 'sugestao_gerada_em'
)
AND NOT EXISTS (
  SELECT 1 FROM migrations WHERE timestamp = 1778500000000
);

INSERT INTO migrations(timestamp, name)
SELECT 1779000000000, 'CreateClinicalGovernanceTables1779000000000'
WHERE EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'clinical_protocol_versions'
)
AND EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'consent_purpose_logs'
)
AND EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'clinical_audit_logs'
)
AND NOT EXISTS (
  SELECT 1 FROM migrations WHERE timestamp = 1779000000000
);

INSERT INTO migrations(timestamp, name)
SELECT 1779100000000, 'AddClinicalFlowFilterIndexes1779100000000'
WHERE EXISTS (
  SELECT 1
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname = 'IDX_CLINICAL_FLOW_EVENTS_OCCURRED_AT'
)
AND NOT EXISTS (
  SELECT 1 FROM migrations WHERE timestamp = 1779100000000
);

